import { InventoryHelper } from './inventory.helper';
import { Prisma } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { BadRequestException } from '@nestjs/common';

describe('InventoryHelper', () => {
  let txMock: DeepMockProxy<Prisma.TransactionClient>;

  beforeEach(() => {
    txMock = mockDeep<Prisma.TransactionClient>();
  });

  describe('deductInventoryFIFO', () => {
    const branchId = 1;
    let ingredientRequirements: Map<number, number>;

    beforeEach(() => {
      ingredientRequirements = new Map<number, number>();
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
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

      expect(txMock.branchInventory.update).not.toHaveBeenCalled();
    });

    it('should deduct from BranchInventory and InventoryBatches using FIFO correctly', async () => {
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
      expect(txMock.branchInventory.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: 35 }, // 50 - 15
      });

      // Verify FIFO logic
      expect(txMock.inventoryBatch.update).toHaveBeenCalledTimes(2);

      // Batch 1 should be depleted
      expect(txMock.inventoryBatch.update).toHaveBeenNthCalledWith(1, {
        where: { id: 10 },
        data: { quantity: 0, status: 'DEPLETED' },
      });

      // Batch 2 should be partially deducted
      expect(txMock.inventoryBatch.update).toHaveBeenNthCalledWith(2, {
        where: { id: 11 },
        data: { quantity: 5 }, // 10 - 5
      });
    });

    it('should throw when batch records do not cover required quantity', async () => {
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
});
