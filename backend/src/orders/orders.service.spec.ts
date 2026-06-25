import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { MockPrismaService, PrismaServiceMockProvider } from '../prisma/prisma.service.mock';
import { EventsGateway } from '../events/events.gateway';
import { ProcurementService } from '../procurement/procurement.service';
import { CustomersService } from '../customers/customers.service';
import { OutboxService } from '../outbox/outbox.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: MockPrismaService;
  let eventsGateway: jest.Mocked<EventsGateway>;

  const TEST_BRANCH_ID = 2;

  beforeEach(async () => {
    const mockEventsGateway = {
      server: { emit: jest.fn() },
      emitOrderCreated: jest.fn(),
    };
    
    const mockProcurementService = {
      checkAndAutoReorder: jest.fn().mockResolvedValue(undefined),
    };

    const mockCustomersService = {
      checkAndUpdateTier: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        PrismaServiceMockProvider,
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
        {
          provide: ProcurementService,
          useValue: mockProcurementService,
        },
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
        {
          provide: OutboxService,
          useValue: { enqueue: jest.fn().mockResolvedValue({ id: 1 }) },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService) as MockPrismaService;

    // Mock $transaction to simply yield the mocked prisma client
    prisma.$transaction.mockImplementation(async (cb: Function) => cb(prisma));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    const mockOrderData = {
      userId: 1,
      branchId: TEST_BRANCH_ID,
      items: [{ productId: 1, quantity: 2 }],
    };

    it('should throw BadRequestException if product is not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.createOrder(mockOrderData)).rejects.toThrow(
        new BadRequestException('Product with ID 1 not found'),
      );
    });

    it('should throw BadRequestException if not enough stock', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 1,
        name: 'Latte',
        price: 100,
        categoryId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        recipeItems: [
          {
            id: 1,
            productId: 1,
            ingredientId: 1,
            quantity: 20, // Requires 20g
            ingredient: { id: 1, name: 'Coffee Beans', costPerUnit: 1, unit: 'g', minStock: 100, createdAt: new Date(), updatedAt: new Date() },
          },
        ],
      } as any);

      // Mock BranchInventory to have insufficient stock (needs 40g for 2 Lattes, only has 10g)
      prisma.branchInventory.findUnique.mockResolvedValue({
        id: 1,
        branchId: TEST_BRANCH_ID,
        ingredientId: 1,
        stock: 10,
        minStock: 50,
        updatedAt: new Date(),
        ingredient: { id: 1, name: 'Coffee Beans', costPerUnit: 1, unit: 'g', minStock: 100, createdAt: new Date(), updatedAt: new Date() },
      } as any);

      await expect(service.createOrder(mockOrderData)).rejects.toThrow(
        new BadRequestException('Not enough stock for Coffee Beans at this branch.'),
      );
    });

    it('should successfully create order and deduct stock', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 1,
        price: 100,
        recipeItems: [
          {
            ingredientId: 1,
            quantity: 20, // 20g per item. We order 2 items, so 40g needed.
            ingredient: { costPerUnit: 1 }, // COGS = 40 * 1 = 40
          },
        ],
      } as any);

      prisma.branchInventory.findUnique.mockResolvedValue({
        id: 1,
        branchId: TEST_BRANCH_ID,
        ingredientId: 1,
        stock: 100, // Sufficient stock
      } as any);

      prisma.branchInventory.update.mockResolvedValue({} as any);

      prisma.inventoryBatch.findMany.mockResolvedValue([
        { id: 1, quantity: 100, status: 'ACTIVE' },
      ] as any);

      prisma.order.create.mockResolvedValue({
        id: 1,
        totalAmount: 200,
        totalCogs: 40,
        netAmount: 200,
      } as any);

      const result = await service.createOrder(mockOrderData);

      expect(prisma.branchInventory.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: 60 }, // 100 - 40
      });

      expect(prisma.inventoryBatch.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantity: 60 },
      });

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 200,
            totalCogs: 40,
            netAmount: 200,
          }),
        }),
      );

      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if promo code is invalid', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 1, price: 100, recipeItems: []
      } as any);

      // Mock promo not found
      prisma.promotion.findUnique.mockResolvedValue(null);

      await expect(service.createOrder({ ...mockOrderData, promotionCode: 'INVALID' })).rejects.toThrow(
        new BadRequestException('Invalid or inactive promotion')
      );
    });

    it('should correctly calculate discounts for points and valid percentage promo', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 1, price: 100, recipeItems: []
      } as any);

      prisma.customer.findUnique.mockResolvedValue({
        id: 1, phone: '1234567890', points: 50
      } as any);

      prisma.promotion.findUnique.mockResolvedValue({
        id: 1, code: 'SALE20', isActive: true, discountType: 'PERCENTAGE', discountValue: 20
      } as any);

      prisma.customer.update.mockResolvedValue({} as any);
      
      prisma.order.create.mockResolvedValue({ id: 1 } as any);

      await service.createOrder({
        ...mockOrderData,
        customerPhone: '1234567890',
        pointsToRedeem: 50,
        promotionCode: 'SALE20'
      });

      // Total = 2 items * 100 = 200
      // Points = 50 THB
      // Promo = 20% of 200 = 40 THB
      // Total Discount = 50 + 40 = 90 THB
      // Net Amount = 200 - 90 = 110 THB
      
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            discountAmount: 90,
            netAmount: 110,
          })
        })
      );
      
      // Points deduction
      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { points: { decrement: 50 } }
      });
    });
  });
});
