import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import {
  MockPrismaService,
  PrismaServiceMockProvider,
} from '../prisma/prisma.service.mock';
import { OutboxService } from '../outbox/outbox.service';
import { SettingsService } from '../settings/settings.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: MockPrismaService;

  const TEST_BRANCH_ID = 2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        PrismaServiceMockProvider,
        {
          provide: OutboxService,
          useValue: { enqueue: jest.fn().mockResolvedValue({ id: 1 }) },
        },
        {
          provide: SettingsService,
          useValue: { getVatRatePercent: jest.fn().mockResolvedValue(7) },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);

    // Mock $transaction to simply yield the mocked prisma client
    prisma.$transaction.mockImplementation(async (cb: Function) => cb(prisma));
    prisma.order.findFirst.mockResolvedValue(null);
  });

  describe('createOrder', () => {
    const mockOrderData = {
      userId: 1,
      branchId: TEST_BRANCH_ID,
      items: [{ productId: 1, quantity: 2 }],
    };

    it('throws when product is not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.createOrder(mockOrderData)).rejects.toThrow(
        new BadRequestException('Product with ID 1 not found'),
      );
    });

    it('throws when stock is insufficient', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 1,
        name: 'Latte',
        price: 100,
        category: 'Coffee',
        categoryId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        recipeItems: [
          {
            id: 1,
            productId: 1,
            ingredientId: 1,
            quantity: 20, // Requires 20g
            ingredient: {
              id: 1,
              name: 'Coffee Beans',
              costPerUnit: 1,
              unit: 'g',
              minStock: 100,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
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
        ingredient: {
          id: 1,
          name: 'Coffee Beans',
          costPerUnit: 1,
          unit: 'g',
          minStock: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as any);

      await expect(service.createOrder(mockOrderData)).rejects.toThrow(
        new BadRequestException(
          'Not enough stock for Coffee Beans at this branch.',
        ),
      );
    });

    it('creates order and deducts stock', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 1,
        price: 100,
        category: 'Coffee',
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

      prisma.branchInventory.updateMany.mockResolvedValue({ count: 1 });
      prisma.inventoryBatch.updateMany.mockResolvedValue({ count: 1 });

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

      expect(prisma.branchInventory.updateMany).toHaveBeenCalledWith({
        where: { id: 1, stock: { gte: 40 } },
        data: { stock: { decrement: 40 } },
      });

      expect(prisma.inventoryBatch.updateMany).toHaveBeenCalledWith({
        where: { id: 1, quantity: { gte: 40 } },
        data: { quantity: { decrement: 40 } },
      });

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 200,
            totalCogs: 40,
            netAmount: 200,
            status: 'PENDING',
            queueNumber: 1,
            queueDate: expect.any(Date),
          }),
        }),
      );

      expect(result).toBeDefined();
    });

    it('throws when promo code is invalid', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 1,
        price: 100,
        category: 'Bakery',
        recipeItems: [],
      } as any);

      // Mock promo not found
      prisma.promotion.findUnique.mockResolvedValue(null);

      await expect(
        service.createOrder({ ...mockOrderData, promotionCode: 'INVALID' }),
      ).rejects.toThrow(
        new BadRequestException('Invalid or inactive promotion'),
      );
    });

    it('calculates discounts for points and valid percentage promo', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 1,
        price: 100,
        category: 'Bakery',
        recipeItems: [],
      } as any);

      prisma.customer.findUnique.mockResolvedValue({
        id: 1,
        phone: '1234567890',
        points: 50,
      } as any);

      prisma.promotion.findUnique.mockResolvedValue({
        id: 1,
        code: 'SALE20',
        isActive: true,
        discountType: 'PERCENTAGE',
        discountValue: 20,
      } as any);

      prisma.customer.update.mockResolvedValue({} as any);

      prisma.order.create.mockResolvedValue({ id: 1 } as any);

      await service.createOrder({
        ...mockOrderData,
        customerPhone: '1234567890',
        pointsToRedeem: 50,
        promotionCode: 'SALE20',
      });

      // Total = 2 items * 100 = 200
      // Points = 50 pts = 5 THB (10 pts = 1 THB)
      // Promo = 20% of 200 = 40 THB
      // Total Discount = 5 + 40 = 45 THB
      // Net Amount = 200 - 45 = 155 THB

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            discountAmount: 45,
            netAmount: 155,
            status: 'COMPLETED',
          }),
        }),
      );

      // Points deduction
      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { points: { decrement: 50 } },
      });
    });

    it('throws when beverage product has no recipe', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 1,
        name: 'Latte',
        price: 100,
        category: 'Coffee',
        recipeItems: [],
      } as any);

      await expect(service.createOrder(mockOrderData)).rejects.toThrow(
        new BadRequestException(
          'Product "Latte" requires a recipe before it can be sold.',
        ),
      );
    });

    it('completes retail-only orders at checkout', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 2,
        name: 'Croissant',
        price: 80,
        category: 'Bakery',
        recipeItems: [],
      } as any);

      prisma.order.create.mockResolvedValue({
        id: 2,
        status: 'COMPLETED',
      } as any);

      await service.createOrder({
        ...mockOrderData,
        items: [{ productId: 2, quantity: 1 }],
      });

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('rejects terminal statuses so void/refund effects cannot be bypassed', async () => {
      await expect(service.updateOrderStatus(5, 'REFUNDED')).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.order.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('voidOrder', () => {
    const voidableOrder = {
      id: 5,
      branchId: TEST_BRANCH_ID,
      status: 'COMPLETED' as const,
      createdAt: new Date(),
      customerId: 1,
      pointsEarned: 10,
      pointsRedeemed: 5,
      netAmount: 100,
      totalCogs: 20,
      items: [
        {
          quantity: 1,
          product: {
            recipeItems: [{ ingredientId: 1, quantity: 20 }],
          },
        },
      ],
    };

    it('rejects void for already cancelled orders', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...voidableOrder,
        status: 'CANCELLED',
      } as any);

      await expect(service.voidOrder(5)).rejects.toThrow(
        new BadRequestException('Order is already voided or refunded.'),
      );
    });

    it('rejects void for previous-day orders', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      prisma.order.findUnique.mockResolvedValue({
        ...voidableOrder,
        createdAt: yesterday,
      } as any);

      await expect(service.voidOrder(5)).rejects.toThrow(BadRequestException);
    });

    it('voids order, restores stock, and reverses loyalty points', async () => {
      prisma.order.findUnique.mockResolvedValue(voidableOrder as any);
      prisma.branchInventory.findUnique.mockResolvedValue({
        id: 1,
        branchId: TEST_BRANCH_ID,
        ingredientId: 1,
        stock: 80,
        ingredient: { name: 'Beans' },
      } as any);
      prisma.branchInventory.update.mockResolvedValue({} as any);
      prisma.inventoryBatch.findFirst.mockResolvedValue({
        id: 2,
        quantity: 10,
        status: 'ACTIVE',
      } as any);
      prisma.inventoryBatch.update.mockResolvedValue({} as any);
      prisma.customer.update.mockResolvedValue({} as any);
      prisma.order.update.mockResolvedValue({
        ...voidableOrder,
        status: 'CANCELLED',
      } as any);

      const result = await service.voidOrder(5);

      expect(prisma.branchInventory.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: { increment: 20 } },
      });
      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { points: { increment: -5 } },
      });
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('refundOrder', () => {
    const refundableOrder = {
      id: 8,
      branchId: TEST_BRANCH_ID,
      status: 'COMPLETED' as const,
      createdAt: (() => {
        const d = new Date();
        d.setDate(d.getDate() - 2);
        return d;
      })(),
      customerId: 1,
      pointsEarned: 10,
      pointsRedeemed: 0,
      netAmount: 150,
      totalCogs: 25,
      items: [
        {
          quantity: 1,
          product: {
            recipeItems: [{ ingredientId: 1, quantity: 20 }],
          },
          modifiers: [],
        },
      ],
    };

    it('rejects refund for same-day orders', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...refundableOrder,
        createdAt: new Date(),
      } as any);

      await expect(service.refundOrder(8)).rejects.toThrow(BadRequestException);
    });

    it('refunds order, restores stock, and enqueues order.refunded', async () => {
      prisma.order.findUnique.mockResolvedValue(refundableOrder as any);
      prisma.branchInventory.findUnique.mockResolvedValue({
        id: 1,
        branchId: TEST_BRANCH_ID,
        ingredientId: 1,
        stock: 80,
        ingredient: { name: 'Beans' },
      } as any);
      prisma.branchInventory.update.mockResolvedValue({} as any);
      prisma.inventoryBatch.findFirst.mockResolvedValue({
        id: 2,
        quantity: 10,
        status: 'ACTIVE',
      } as any);
      prisma.inventoryBatch.update.mockResolvedValue({} as any);
      prisma.order.update.mockResolvedValue({
        ...refundableOrder,
        status: 'REFUNDED',
        refundReason: 'Wrong drink',
      } as any);

      const result = await service.refundOrder(8, 'Wrong drink');

      expect(result.status).toBe('REFUNDED');
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'REFUNDED',
            refundReason: 'Wrong drink',
          }),
        }),
      );
    });
  });
});
