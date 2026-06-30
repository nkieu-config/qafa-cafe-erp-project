import { Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

export class InventoryHelper {
  static async deductInventoryFIFO(
    tx: Prisma.TransactionClient,
    branchId: number,
    ingredientRequirements: Map<number, number>,
  ) {
    for (const [ingredientId, neededQty] of ingredientRequirements.entries()) {
      const branchInventory = await tx.branchInventory.findUnique({
        where: { branchId_ingredientId: { branchId, ingredientId } },
        include: { ingredient: true },
      });

      if (!branchInventory || branchInventory.stock < neededQty) {
        const name = branchInventory?.ingredient?.name || `ID ${ingredientId}`;
        throw new BadRequestException(
          `Not enough stock for ${name} at this branch.`,
        );
      }

      // Deduct from BranchInventory (Cache)
      const updatedInventory = await tx.branchInventory.updateMany({
        where: { id: branchInventory.id, stock: { gte: neededQty } },
        data: { stock: { decrement: neededQty } },
      });
      if (updatedInventory.count === 0) {
        throw new BadRequestException(
          `Not enough stock for ${branchInventory.ingredient.name} at this branch.`,
        );
      }

      // FIFO Deduction from InventoryBatch
      let remainingToDeduct = neededQty;
      const activeBatches = await tx.inventoryBatch.findMany({
        where: {
          branchId,
          ingredientId,
          status: 'ACTIVE',
          OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
        },
        orderBy: [{ expiryDate: 'asc' }, { createdAt: 'asc' }],
      });

      for (const batch of activeBatches) {
        if (remainingToDeduct <= 0) break;

        if (batch.quantity <= remainingToDeduct) {
          remainingToDeduct -= batch.quantity;
          const updatedBatch = await tx.inventoryBatch.updateMany({
            where: { id: batch.id, quantity: batch.quantity },
            data: { quantity: 0, status: 'DEPLETED' },
          });
          if (updatedBatch.count === 0) {
            throw new BadRequestException(
              `Inventory batch changed while deducting ${branchInventory.ingredient.name}. Please retry.`,
            );
          }
        } else {
          const updatedBatch = await tx.inventoryBatch.updateMany({
            where: { id: batch.id, quantity: { gte: remainingToDeduct } },
            data: { quantity: { decrement: remainingToDeduct } },
          });
          if (updatedBatch.count === 0) {
            throw new BadRequestException(
              `Inventory batch changed while deducting ${branchInventory.ingredient.name}. Please retry.`,
            );
          }
          remainingToDeduct = 0;
        }
      }

      if (remainingToDeduct > 0) {
        const name = branchInventory.ingredient?.name || `ID ${ingredientId}`;
        throw new BadRequestException(
          `Inventory batches are out of sync for ${name}. Missing ${remainingToDeduct} units in batch records.`,
        );
      }
    }
  }

  /** Restore stock after void/refund — mirrors branch cache + batch records. */
  static async restoreInventory(
    tx: Prisma.TransactionClient,
    branchId: number,
    ingredientRequirements: Map<number, number>,
  ) {
    for (const [ingredientId, qty] of ingredientRequirements.entries()) {
      if (qty <= 0) continue;

      const branchInventory = await tx.branchInventory.findUnique({
        where: { branchId_ingredientId: { branchId, ingredientId } },
        include: { ingredient: true },
      });

      if (!branchInventory) {
        const name = `ID ${ingredientId}`;
        throw new BadRequestException(
          `Branch inventory not found for ${name}.`,
        );
      }

      await tx.branchInventory.update({
        where: { id: branchInventory.id },
        data: { stock: { increment: qty } },
      });

      const activeBatch = await tx.inventoryBatch.findFirst({
        where: { branchId, ingredientId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      });

      if (activeBatch) {
        await tx.inventoryBatch.update({
          where: { id: activeBatch.id },
          data: { quantity: { increment: qty } },
        });
      } else {
        await tx.inventoryBatch.create({
          data: {
            branchId,
            ingredientId,
            quantity: qty,
            status: 'ACTIVE',
          },
        });
      }
    }
  }
}
