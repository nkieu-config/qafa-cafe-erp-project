import { Prisma } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { WasteDisposalHelper } from './waste-disposal.helper';

describe('WasteDisposalHelper', () => {
  let txMock: DeepMockProxy<Prisma.TransactionClient>;

  beforeEach(() => {
    txMock = mockDeep<Prisma.TransactionClient>();
    txMock.branchInventory.updateMany.mockResolvedValue({ count: 1 });
  });

  describe('disposeBatchAsWaste', () => {
    it('returns null when batch is not active', async () => {
      txMock.inventoryBatch.findUnique.mockResolvedValue({
        id: 1,
        status: 'EXPIRED',
        quantity: 100,
      } as never);

      const result = await WasteDisposalHelper.disposeBatchAsWaste(txMock, {
        batchId: 1,
        userId: 9,
        reason: 'Auto-disposed: batch expired',
      });

      expect(result).toBeNull();
      expect(txMock.wasteLog.create).not.toHaveBeenCalled();
    });

    it('creates waste log, deducts stock, marks batch EXPIRED, and writes audit', async () => {
      txMock.inventoryBatch.findUnique.mockResolvedValue({
        id: 7,
        branchId: 2,
        ingredientId: 3,
        status: 'ACTIVE',
        quantity: 250,
      } as never);
      txMock.wasteLog.create.mockResolvedValue({ id: 99 } as never);
      txMock.branchInventory.findUnique.mockResolvedValue({
        id: 11,
        stock: 3000,
      } as never);

      const result = await WasteDisposalHelper.disposeBatchAsWaste(txMock, {
        batchId: 7,
        userId: 1,
        reason: 'Auto-disposed: batch expired',
        batchStatus: 'EXPIRED',
        audit: {
          action: 'AUTO_WASTE',
          details: 'Auto-disposed expired batch #7',
        },
      });

      expect(result).toEqual({ id: 99 });
      expect(txMock.wasteLog.create).toHaveBeenCalledWith({
        data: {
          branchId: 2,
          ingredientId: 3,
          quantity: 250,
          reason: 'Auto-disposed: batch expired',
          recordedById: 1,
        },
      });
      expect(txMock.branchInventory.updateMany).toHaveBeenCalledWith({
        where: { id: 11, stock: { gte: 250 } },
        data: { stock: { decrement: 250 } },
      });
      expect(txMock.inventoryBatch.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { status: 'EXPIRED', quantity: 0 },
      });
      expect(txMock.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          action: 'AUTO_WASTE',
          targetType: 'InventoryBatch',
          targetId: 7,
          details: 'Auto-disposed expired batch #7',
        },
      });
    });
  });

  describe('recordWaste', () => {
    it('deducts from a specific batch and records one waste log', async () => {
      txMock.inventoryBatch.findUnique.mockResolvedValue({
        id: 5,
        branchId: 1,
        ingredientId: 10,
        status: 'ACTIVE',
        quantity: 100,
      } as never);
      txMock.wasteLog.create.mockResolvedValue({ id: 42 } as never);
      txMock.branchInventory.findUnique.mockResolvedValue({
        id: 3,
        stock: 500,
      } as never);

      const result = await WasteDisposalHelper.recordWaste(
        txMock,
        1,
        {
          batchId: 5,
          ingredientId: 10,
          quantity: 40,
          reason: 'Spilled',
        },
        2,
      );

      expect(result).toEqual({ id: 42 });
      expect(txMock.inventoryBatch.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { quantity: 60, status: 'ACTIVE' },
      });
      expect(txMock.branchInventory.updateMany).toHaveBeenCalledWith({
        where: { id: 3, stock: { gte: 40 } },
        data: { stock: { decrement: 40 } },
      });
    });
  });
});
