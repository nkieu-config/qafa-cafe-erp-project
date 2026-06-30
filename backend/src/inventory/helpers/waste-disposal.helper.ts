import { BatchStatus, Prisma, WasteLog } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

export class WasteDisposalHelper {
  static async deductFromBatch(
    tx: Prisma.TransactionClient,
    batch: { id: number; quantity: number },
    quantity: number,
    finalStatusWhenEmpty: BatchStatus = 'DEPLETED',
  ): Promise<number> {
    const deductQty = Math.min(batch.quantity, quantity);
    if (deductQty <= 0) return 0;

    const newQty = batch.quantity - deductQty;
    await tx.inventoryBatch.update({
      where: { id: batch.id },
      data: {
        quantity: newQty,
        status: newQty <= 0 ? finalStatusWhenEmpty : 'ACTIVE',
      },
    });

    return deductQty;
  }

  static async decrementBranchStock(
    tx: Prisma.TransactionClient,
    branchId: number,
    ingredientId: number,
    quantity: number,
  ): Promise<void> {
    const inventory = await tx.branchInventory.findUnique({
      where: {
        branchId_ingredientId: { branchId, ingredientId },
      },
    });

    if (!inventory) {
      throw new BadRequestException('Branch inventory record was not found.');
    }

    const updated = await tx.branchInventory.updateMany({
      where: { id: inventory.id, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (updated.count === 0) {
      throw new BadRequestException(
        'Branch inventory does not have enough stock to record this waste.',
      );
    }
  }

  static async createWasteLog(
    tx: Prisma.TransactionClient,
    data: {
      branchId: number;
      ingredientId: number;
      quantity: number;
      reason: string;
      recordedById: number;
    },
  ): Promise<WasteLog> {
    return tx.wasteLog.create({ data });
  }

  static async disposeBatchAsWaste(
    tx: Prisma.TransactionClient,
    params: {
      batchId: number;
      userId: number;
      reason: string;
      batchStatus?: BatchStatus;
      audit?: { action: string; details: string };
    },
  ): Promise<WasteLog | null> {
    const batch = await tx.inventoryBatch.findUnique({
      where: { id: params.batchId },
    });

    if (!batch || batch.status !== 'ACTIVE' || batch.quantity <= 0) {
      return null;
    }

    const qty = batch.quantity;

    const log = await this.createWasteLog(tx, {
      branchId: batch.branchId,
      ingredientId: batch.ingredientId,
      quantity: qty,
      reason: params.reason,
      recordedById: params.userId,
    });

    await this.decrementBranchStock(
      tx,
      batch.branchId,
      batch.ingredientId,
      qty,
    );

    await tx.inventoryBatch.update({
      where: { id: batch.id },
      data: {
        status: params.batchStatus ?? 'EXPIRED',
        quantity: 0,
      },
    });

    if (params.audit) {
      await tx.auditLog.create({
        data: {
          userId: params.userId,
          action: params.audit.action,
          targetType: 'InventoryBatch',
          targetId: batch.id,
          details: params.audit.details,
        },
      });
    }

    return log;
  }

  static async recordWaste(
    tx: Prisma.TransactionClient,
    branchId: number,
    data: {
      batchId?: number;
      ingredientId: number;
      quantity: number;
      reason: string;
    },
    userId: number,
  ): Promise<WasteLog> {
    let remainingToDeduct = data.quantity;

    if (data.batchId) {
      const batch = await tx.inventoryBatch.findUnique({
        where: { id: data.batchId },
      });
      if (batch && batch.branchId === branchId && batch.status === 'ACTIVE') {
        remainingToDeduct -= await this.deductFromBatch(
          tx,
          batch,
          remainingToDeduct,
        );
      }
    }

    if (remainingToDeduct > 0) {
      const activeBatches = await tx.inventoryBatch.findMany({
        where: {
          branchId,
          ingredientId: data.ingredientId,
          status: 'ACTIVE',
        },
        orderBy: [{ expiryDate: 'asc' }, { createdAt: 'asc' }],
      });

      for (const batch of activeBatches) {
        if (remainingToDeduct <= 0) break;
        remainingToDeduct -= await this.deductFromBatch(
          tx,
          batch,
          remainingToDeduct,
        );
      }
    }

    await this.decrementBranchStock(
      tx,
      branchId,
      data.ingredientId,
      data.quantity,
    );

    return this.createWasteLog(tx, {
      branchId,
      ingredientId: data.ingredientId,
      quantity: data.quantity,
      reason: data.reason,
      recordedById: userId,
    });
  }
}
