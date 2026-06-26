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
      await tx.branchInventory.update({
        where: { id: branchInventory.id },
        data: { stock: branchInventory.stock - neededQty },
      });

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
          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: { quantity: 0, status: 'DEPLETED' },
          });
        } else {
          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: { quantity: batch.quantity - remainingToDeduct },
          });
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
}
