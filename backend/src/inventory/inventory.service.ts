import { Injectable } from '@nestjs/common';
import { InventoryBatch, BranchInventory, WasteLog } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryHelper } from '../orders/helpers/inventory.helper';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getBalance(branchId: number) {
    return this.prisma.branchInventory.findMany({
      where: { branchId },
      include: { ingredient: true },
      orderBy: { ingredient: { name: 'asc' } },
    });
  }

  async receiveStock(
    branchId: number,
    data: {
      items: { ingredientId: number; quantity: number; expiryDate?: Date }[];
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const results: Array<{
        batch: InventoryBatch;
        inventory: BranchInventory;
      }> = [];
      for (const item of data.items) {
        if (item.quantity <= 0) continue;

        // 1. Create the Batch
        const batch = await tx.inventoryBatch.create({
          data: {
            branchId,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            status: 'ACTIVE',
          },
        });

        // 2. Upsert Branch Inventory
        const inventory = await tx.branchInventory.upsert({
          where: {
            branchId_ingredientId: {
              branchId,
              ingredientId: item.ingredientId,
            },
          },
          update: { stock: { increment: item.quantity } },
          create: {
            branchId,
            ingredientId: item.ingredientId,
            stock: item.quantity,
            minStock: 10, // default min stock, should ideally be configured per branch
          },
        });

        results.push({ batch, inventory });
      }
      return results;
    });
  }

  async recordWaste(
    branchId: number,
    userId: number,
    data: {
      items: { ingredientId: number; quantity: number; reason: string }[];
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const results: WasteLog[] = [];
      for (const item of data.items) {
        if (item.quantity <= 0) continue;

        // 1. Create WasteLog
        const log = await tx.wasteLog.create({
          data: {
            branchId,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            reason: item.reason,
            recordedById: userId,
          },
        });

        // 2. Deduct using the FIFO helper
        const map = new Map<number, number>();
        map.set(item.ingredientId, item.quantity);
        await InventoryHelper.deductInventoryFIFO(tx, branchId, map);

        results.push(log);
      }
      return results;
    });
  }
}
