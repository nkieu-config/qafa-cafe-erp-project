import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { MockPrismaService, PrismaServiceMockProvider } from '../prisma/prisma.service.mock';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        PrismaServiceMockProvider,
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService) as MockPrismaService;

    // Mock $transaction to simply yield the mocked prisma client
    prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    const mockOrderData = {
      userId: 1,
      branchId: 1,
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
        branchId: 1,
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
        branchId: 1,
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
  });
});
