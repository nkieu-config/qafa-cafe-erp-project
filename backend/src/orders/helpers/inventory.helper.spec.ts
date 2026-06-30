import { InventoryHelper } from './inventory.helper';
import { Prisma } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { BadRequestException } from '@nestjs/common';

describe('InventoryHelper', () => {
  let txMock: DeepMockProxy<Prisma.TransactionClient>;

  beforeEach(() => {
    txMock = mockDeep<Prisma.TransactionClient>();
    txMock.branchInventory.updateMany.mockResolvedValue({ count: 1 });
    txMock.inventoryBatch.updateMany.mockResolvedValue({ count: 1 });
  });

  describe('deductInventoryFIFO', () => {
    const branchId = 1;
    let ingredientRequirements: Map<number, number>;

    beforeEach(() => {
      ingredientRequirements = new Map<number, number>();
    });

    it('throws when stock is insufficient', async () => {
      ingredientRequirements.set(100, 50); // Need 50 units

      txMock.branchInventory.findUnique.mockResolvedValue({
        id: 1,
        branchId,
        ingredientId: 100,
        stock: 10, // Only 10 available
        minStock: 5,
        // @ts-ignore (ignoring nested relation strict typing for simplicity in mock)
        ingredient: { name: 'Coffee Beans' },
      } as any);

      await expect(
        InventoryHelper.deductInventoryFIFO(
          txMock as unknown as Prisma.TransactionClient,
          branchId,
          ingredientRequirements,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(txMock.branchInventory.updateMany).not.toHaveBeenCalled();
    });

    it('deducts from BranchInventory and InventoryBatches using FIFO', async () => {
      ingredientRequirements.set(100, 15); // Need 15 units

      txMock.branchInventory.findUnique.mockResolvedValue({
        id: 1,
        branchId,
        ingredientId: 100,
        stock: 50, // Plenty of stock
        minStock: 5,
        // @ts-ignore
        ingredient: { name: 'Coffee Beans' },
      } as any);

      txMock.inventoryBatch.findMany.mockResolvedValue([
        { id: 10, quantity: 10, status: 'ACTIVE' }, // First batch has 10 (will be depleted)
        { id: 11, quantity: 10, status: 'ACTIVE' }, // Second batch has 10 (5 will be taken)
      ] as any);

      await InventoryHelper.deductInventoryFIFO(
        txMock,
        branchId,
        ingredientRequirements,
      );

      // Verify aggregate cache update
      expect(txMock.branchInventory.updateMany).toHaveBeenCalledWith({
        where: { id: 1, stock: { gte: 15 } },
        data: { stock: { decrement: 15 } },
      });

      // Verify FIFO logic
      expect(txMock.inventoryBatch.updateMany).toHaveBeenCalledTimes(2);

      // Batch 1 should be depleted
      expect(txMock.inventoryBatch.updateMany).toHaveBeenNthCalledWith(1, {
        where: { id: 10, quantity: 10 },
        data: { quantity: 0, status: 'DEPLETED' },
      });

      // Batch 2 should be partially deducted
      expect(txMock.inventoryBatch.updateMany).toHaveBeenNthCalledWith(2, {
        where: { id: 11, quantity: { gte: 5 } },
        data: { quantity: { decrement: 5 } },
      });
    });

    it('throws when batch records do not cover required quantity', async () => {
      ingredientRequirements.set(100, 15);

      txMock.branchInventory.findUnique.mockResolvedValue({
        id: 1,
        branchId,
        ingredientId: 100,
        stock: 50,
        minStock: 5,
        ingredient: { name: 'Coffee Beans' },
      } as any);

      txMock.inventoryBatch.findMany.mockResolvedValue([
        { id: 10, quantity: 5, status: 'ACTIVE' },
      ] as any);

      await expect(
        InventoryHelper.deductInventoryFIFO(
          txMock as unknown as Prisma.TransactionClient,
          branchId,
          ingredientRequirements,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('restoreInventory', () => {
    const branchId = 1;
    let restoreRequirements: Map<number, number>;

    beforeEach(() => {
      restoreRequirements = new Map<number, number>();
    });

    it('restores branch stock and adds to active batch', async () => {
      restoreRequirements.set(100, 10);

      txMock.branchInventory.findUnique.mockResolvedValue({
        id: 1,
        branchId: 1,
        ingredientId: 100,
        stock: 40,
        minStock: 5,
        ingredient: { name: 'Milk' },
      } as any);

      txMock.inventoryBatch.findFirst.mockResolvedValue({
        id: 20,
        quantity: 5,
        status: 'ACTIVE',
      } as any);

      await InventoryHelper.restoreInventory(
        txMock,
        branchId,
        restoreRequirements,
      );

      expect(txMock.branchInventory.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: { increment: 10 } },
      });

      expect(txMock.inventoryBatch.update).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { quantity: { increment: 10 } },
      });
    });
  });
});
