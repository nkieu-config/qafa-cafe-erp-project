import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { toNum } from '../common/decimal.util';

@Injectable()
export class ProductionService {
  constructor(
    private prisma: PrismaService,
    private accountingService: AccountingService
  ) {}

  // 1. Get all Production Orders
  async getProductionOrders() {
    return this.prisma.productionOrder.findMany({
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
  async createProductionOrder(data: { branchId: number, targetIngredientId: number, quantityToProduce: number, plannedStartDate?: Date }) {
    // Ensure the branch is a central kitchen
    const branch = await this.prisma.branch.findUnique({ where: { id: data.branchId } });
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
      }
    });
  }

  // Update Order Status (for Kanban dragging)
  async updateOrderStatus(orderId: number, status: string) {
    return this.prisma.productionOrder.update({
      where: { id: orderId },
      data: { status: status as any }
    });
  }

  // 4. Complete a Production Order (Deduct raw materials, add finished good)
  async completeProductionOrder(orderId: number, userId?: number) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.productionOrder.findUnique({
        where: { id: orderId },
        include: { targetIngredient: true }
      });

      if (!order) throw new BadRequestException('Order not found');
      if (order.status === 'COMPLETED') throw new BadRequestException('Order already completed');

      // Find BOM for the target ingredient
      const boms = await tx.productionBOM.findMany({
        where: { targetIngredientId: order.targetIngredientId },
        include: { rawIngredient: true }
      });

      if (boms.length === 0) {
        throw new BadRequestException('No BOM found for this ingredient');
      }

      let totalRawCost = 0;

      // Deduct Raw Materials
      for (const bom of boms) {
        const requiredQuantity = bom.quantityNeeded * order.quantityToProduce;
        
        const inventory = await tx.branchInventory.findUnique({
          where: { branchId_ingredientId: { branchId: order.branchId, ingredientId: bom.rawIngredientId } }
        });

        if (!inventory || inventory.stock < requiredQuantity) {
          throw new BadRequestException(`Insufficient stock for raw material: ${bom.rawIngredient.name}. Needed: ${requiredQuantity}, Available: ${inventory?.stock || 0}`);
        }

        // Deduct
        await tx.branchInventory.update({
          where: { id: inventory.id },
          data: { stock: inventory.stock - requiredQuantity }
        });

        totalRawCost += requiredQuantity * toNum(bom.rawIngredient.costPerUnit);
      }

      // Add Finished Good to Inventory
      const targetInventory = await tx.branchInventory.findUnique({
        where: { branchId_ingredientId: { branchId: order.branchId, ingredientId: order.targetIngredientId } }
      });

      if (targetInventory) {
        await tx.branchInventory.update({
          where: { id: targetInventory.id },
          data: { stock: targetInventory.stock + order.quantityToProduce }
        });
      } else {
        await tx.branchInventory.create({
          data: {
            branchId: order.branchId,
            ingredientId: order.targetIngredientId,
            stock: order.quantityToProduce,
            minStock: 0
          }
        });
      }

      // Mark Order as COMPLETED
      const updatedOrder = await tx.productionOrder.update({
        where: { id: orderId },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date(),
          actualCost: totalRawCost,
          createdByUserId: userId
        }
      });

      // Post Journal Entry (Accounting)
      // Debit: Inventory (Finished Good)
      // Credit: Inventory (Raw Materials)
      // Basically, transferring value from one asset to another.
      if (totalRawCost > 0) {
        this.accountingService.createJournalEntry({
          reference: updatedOrder.orderNumber,
          description: `Production Completion for ${order.targetIngredient.name}`,
          lines: [
            { accountCode: '1030', debit: totalRawCost, credit: 0, description: 'Finished Goods Inventory Increase' },
            { accountCode: '1030', debit: 0, credit: totalRawCost, description: 'Raw Materials Inventory Decrease' }
          ]
        }).catch(err => console.error('[Accounting] Failed to post Production journal entry:', err));
      }

      return updatedOrder;
    });
  }

  // Helper to create BOM
  async createBOM(data: { targetIngredientId: number, rawIngredientId: number, quantityNeeded: number }) {
    return this.prisma.productionBOM.upsert({
      where: {
        targetIngredientId_rawIngredientId: {
          targetIngredientId: data.targetIngredientId,
          rawIngredientId: data.rawIngredientId,
        }
      },
      update: { quantityNeeded: data.quantityNeeded },
      create: {
        targetIngredientId: data.targetIngredientId,
        rawIngredientId: data.rawIngredientId,
        quantityNeeded: data.quantityNeeded,
      }
    });
  }
}
