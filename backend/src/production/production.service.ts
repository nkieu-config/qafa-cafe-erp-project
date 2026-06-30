import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toNum, roundMoney } from '../common/decimal.util';
import {
  assertBranchAccess,
  BranchScopedUser,
} from '../auth/branch-scope.util';
import { ProductionStatus } from '@prisma/client';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class ProductionService {
  constructor(
    private prisma: PrismaService,
    private outboxService: OutboxService,
  ) {}

  // 1. Get all Production Orders
  async getProductionOrders(branchId?: number) {
    return this.prisma.productionOrder.findMany({
      where: branchId ? { branchId } : undefined,
      include: {
        branch: true,
        targetIngredient: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 2. Get BOMs
  async getBOMs() {
    return this.prisma.productionBOM.findMany({
      include: {
        targetIngredient: true,
        rawIngredient: true,
      },
    });
  }

  // 3. Create a Production Order
  async createProductionOrder(data: {
    branchId: number;
    targetIngredientId: number;
    quantityToProduce: number;
    plannedStartDate?: Date;
  }) {
    // Ensure the branch is a central kitchen
    const branch = await this.prisma.branch.findUnique({
      where: { id: data.branchId },
    });
    if (!branch || !branch.isCentralKitchen) {
      throw new BadRequestException('Branch is not a central kitchen');
    }

    return this.prisma.productionOrder.create({
      data: {
        orderNumber: `PRD-${Date.now()}`,
        branchId: data.branchId,
        targetIngredientId: data.targetIngredientId,
        quantityToProduce: data.quantityToProduce,
        plannedStartDate: data.plannedStartDate,
        status: 'PLANNED',
      },
    });
  }

  // Update Order Status (for Kanban dragging)
  async updateOrderStatus(
    orderId: number,
    status: ProductionStatus,
    user: BranchScopedUser,
  ) {
    if (status === 'COMPLETED') {
      throw new BadRequestException(
        'Use the complete endpoint to finish production orders.',
      );
    }

    const order = await this.prisma.productionOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new BadRequestException('Order not found');
    assertBranchAccess(user, order.branchId);

    return this.prisma.productionOrder.update({
      where: { id: orderId },
      data: { status },
    });
  }

  // 4. Complete a Production Order (Deduct raw materials, add finished good)
  async completeProductionOrder(
    orderId: number,
    userId?: number,
    user?: BranchScopedUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.productionOrder.findUnique({
        where: { id: orderId },
        include: { targetIngredient: true },
      });

      if (!order) throw new BadRequestException('Order not found');
      if (user) assertBranchAccess(user, order.branchId);
      if (order.status === 'COMPLETED')
        throw new BadRequestException('Order already completed');

      // Find BOM for the target ingredient
      const boms = await tx.productionBOM.findMany({
        where: { targetIngredientId: order.targetIngredientId },
        include: { rawIngredient: true },
      });

      if (boms.length === 0) {
        throw new BadRequestException('No BOM found for this ingredient');
      }

      let totalRawCost = 0;

      // Deduct Raw Materials
      for (const bom of boms) {
        const requiredQuantity = bom.quantityNeeded * order.quantityToProduce;

        const inventory = await tx.branchInventory.findUnique({
          where: {
            branchId_ingredientId: {
              branchId: order.branchId,
              ingredientId: bom.rawIngredientId,
            },
          },
        });

        if (!inventory || inventory.stock < requiredQuantity) {
          throw new BadRequestException(
            `Insufficient stock for raw material: ${bom.rawIngredient.name}. Needed: ${requiredQuantity}, Available: ${inventory?.stock || 0}`,
          );
        }

        // Deduct atomically so concurrent production cannot overwrite stock.
        const updatedInventory = await tx.branchInventory.updateMany({
          where: { id: inventory.id, stock: { gte: requiredQuantity } },
          data: { stock: { decrement: requiredQuantity } },
        });
        if (updatedInventory.count === 0) {
          throw new BadRequestException(
            `Insufficient stock for raw material: ${bom.rawIngredient.name}. Please retry.`,
          );
        }

        totalRawCost += requiredQuantity * toNum(bom.rawIngredient.costPerUnit);
      }

      totalRawCost = roundMoney(totalRawCost);

      // Add Finished Good to Inventory
      const targetInventory = await tx.branchInventory.findUnique({
        where: {
          branchId_ingredientId: {
            branchId: order.branchId,
            ingredientId: order.targetIngredientId,
          },
        },
      });

      if (targetInventory) {
        await tx.branchInventory.update({
          where: { id: targetInventory.id },
          data: { stock: { increment: order.quantityToProduce } },
        });
      } else {
        await tx.branchInventory.create({
          data: {
            branchId: order.branchId,
            ingredientId: order.targetIngredientId,
            stock: order.quantityToProduce,
            minStock: 0,
          },
        });
      }

      // Mark Order as COMPLETED
      const updatedOrder = await tx.productionOrder.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          actualCost: totalRawCost,
          createdByUserId: userId,
        },
      });

      if (totalRawCost > 0) {
        await this.outboxService.enqueue(tx, 'production.completed', {
          orderNumber: updatedOrder.orderNumber,
          targetIngredientName: order.targetIngredient.name,
          branchId: order.branchId,
          totalRawCost,
        });
      }

      return updatedOrder;
    });
  }

  // Helper to create BOM
  async createBOM(data: {
    targetIngredientId: number;
    rawIngredientId: number;
    quantityNeeded: number;
  }) {
    return this.prisma.productionBOM.upsert({
      where: {
        targetIngredientId_rawIngredientId: {
          targetIngredientId: data.targetIngredientId,
          rawIngredientId: data.rawIngredientId,
        },
      },
      update: { quantityNeeded: data.quantityNeeded },
      create: {
        targetIngredientId: data.targetIngredientId,
        rawIngredientId: data.rawIngredientId,
        quantityNeeded: data.quantityNeeded,
      },
    });
  }
}
