import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../orders/events/order-created.event';
import { assertBranchAccess, BranchScopedUser } from '../auth/branch-scope.util';
import { OutboxService } from '../outbox/outbox.service';
import { toNum, roundMoney } from '../common/decimal.util';

@Injectable()
export class ProcurementService {
  private readonly logger = new Logger(ProcurementService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private outboxService: OutboxService,
  ) {}

  @OnEvent('order.created', { async: true })
  async handleOrderCreated(event: OrderCreatedEvent) {
    this.logger.log(`Handling order.created event for Order ${event.order.id}`);
    for (const ingredientId of event.ingredientRequirements.keys()) {
      await this.checkAndAutoReorder(event.branchId, ingredientId);
    }
  }

  findAllSuppliers() {
    return this.prisma.supplier.findMany();
  }

  findAllPOs(branchId?: number) {
    return this.prisma.purchaseOrder.findMany({
      where: branchId ? { branchId } : undefined,
      include: { supplier: true, branch: true, items: { include: { ingredient: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPO(data: { branchId: number, supplierId: number, items: { ingredientId: number, quantity: number, price: number }[] }, userId?: number) {
    const po = await this.prisma.purchaseOrder.create({
      data: {
        poNumber: `PO-${Date.now()}`,
        branchId: data.branchId,
        supplierId: data.supplierId,
        status: 'PENDING',
        items: {
          create: data.items.map(item => ({
            ingredientId: item.ingredientId,
            quantityRequested: item.quantity,
            unitPrice: item.price
          }))
        }
      },
      include: { items: true }
    });

    if (userId) {
      await this.auditService.logAction(userId, 'CREATE_PO', 'PurchaseOrder', po.id, { poNumber: po.poNumber });
    }

    return po;
  }

  private async validatePOStatus(
    poId: number, 
    allowedStatuses: string[], 
    actionName: string, 
    txClient: any = this.prisma
  ) {
    const po = await txClient.purchaseOrder.findUnique({ 
      where: { id: poId },
      include: { items: true }
    });
    if (!po) throw new BadRequestException('PO not found');
    if (!allowedStatuses.includes(po.status)) {
      throw new BadRequestException(`Cannot ${actionName} PO with status ${po.status}`);
    }
    return po;
  }

  async approvePO(poId: number, userId: number, user: BranchScopedUser) {
    const po = await this.validatePOStatus(poId, ['PENDING'], 'approve');
    assertBranchAccess(user, po.branchId);

    const updatedPo = await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'APPROVED' }
    });

    await this.auditService.logAction(userId, 'APPROVE_PO', 'PurchaseOrder', poId, { poNumber: po.poNumber });
    return updatedPo;
  }

  async rejectPO(poId: number, userId: number, user: BranchScopedUser) {
    const po = await this.validatePOStatus(poId, ['PENDING'], 'reject');
    assertBranchAccess(user, po.branchId);

    const updatedPo = await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'DRAFT' } // Send back to draft or Cancelled. Using DRAFT so it can be edited.
    });

    await this.auditService.logAction(userId, 'REJECT_PO', 'PurchaseOrder', poId, { poNumber: po.poNumber });
    return updatedPo;
  }

  async receivePO(
    poId: number,
    userId?: number,
    expiryDates?: { ingredientId: number, date: string }[],
    user?: BranchScopedUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const po = await this.validatePOStatus(poId, ['APPROVED'], 'receive', tx);
      if (user) assertBranchAccess(user, po.branchId);

      // 1. Update BranchInventory (Cached Total)
      // 2. Create InventoryBatch (FIFO Log)
      for (const item of po.items) {
        // Create Batch
        const expiryDateStr = expiryDates?.find(e => e.ingredientId === item.ingredientId)?.date;
        const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;
        
        await tx.inventoryBatch.create({
          data: {
            branchId: po.branchId,
            ingredientId: item.ingredientId,
            quantity: item.quantityRequested,
            expiryDate: expiryDate,
            poId: po.id,
            status: 'ACTIVE'
          }
        });

        // Update Cached BranchInventory
        const inventory = await tx.branchInventory.findUnique({
          where: { branchId_ingredientId: { branchId: po.branchId, ingredientId: item.ingredientId } }
        });

        if (inventory) {
          await tx.branchInventory.update({
            where: { id: inventory.id },
            data: { stock: inventory.stock + item.quantityRequested }
          });
        } else {
          await tx.branchInventory.create({
            data: {
              branchId: po.branchId,
              ingredientId: item.ingredientId,
              stock: item.quantityRequested,
              minStock: 0
            }
          });
        }
      }

      // Mark PO as RECEIVED
      const updatedPo = await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'RECEIVED' }
      });

      if (userId) {
        await this.auditService.logAction(userId, 'RECEIVE_PO', 'PurchaseOrder', poId, { poNumber: po.poNumber });
      }

      const totalAmount = roundMoney(
        po.items.reduce(
          (sum, item) => sum + item.quantityRequested * toNum(item.unitPrice),
          0,
        ),
      );

      if (totalAmount > 0) {
        await this.outboxService.enqueue(tx, 'purchase-order.received', {
          poId: po.id,
          poNumber: po.poNumber,
          branchId: po.branchId,
          totalAmount,
        });
      }

      return updatedPo;
    });
  }

  async checkAndAutoReorder(branchId: number, ingredientId: number) {
    const inventory = await this.prisma.branchInventory.findUnique({
      where: { branchId_ingredientId: { branchId, ingredientId } },
      include: { ingredient: true }
    });

    if (!inventory || inventory.stock >= inventory.minStock) return;

    const supplierId = inventory.ingredient.primarySupplierId;
    if (!supplierId) {
      console.warn(`[Auto-Reorder] No primary supplier for ingredient ${inventory.ingredient.name}. Skipping.`);
      return;
    }

    // Check if there is already an active PO (DRAFT or PENDING) containing this ingredient
    const existingPO = await this.prisma.purchaseOrder.findFirst({
      where: {
        branchId,
        supplierId,
        status: { in: ['DRAFT', 'PENDING'] },
        items: { some: { ingredientId } }
      }
    });

    if (existingPO) {
      console.log(`[Auto-Reorder] Active PO already exists for ${inventory.ingredient.name}. Skipping.`);
      return;
    }

    // Create or find a DRAFT PO to attach to
    let draftPo = await this.prisma.purchaseOrder.findFirst({
      where: { branchId, supplierId, status: 'DRAFT', isAutoGenerated: true }
    });

    const orderQuantity = Math.max(inventory.minStock * 2, 10); // Simple logic

    if (draftPo) {
      await this.prisma.purchaseOrderItem.create({
        data: {
          poId: draftPo.id,
          ingredientId,
          quantityRequested: orderQuantity,
          unitPrice: inventory.ingredient.costPerUnit || 0
        }
      });
      console.log(`[Auto-Reorder] Appended ${inventory.ingredient.name} to existing Draft PO ${draftPo.poNumber}`);
    } else {
      await this.prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-AUTO-${Date.now()}`,
          branchId,
          supplierId,
          status: 'DRAFT',
          isAutoGenerated: true,
          items: {
            create: [{
              ingredientId,
              quantityRequested: orderQuantity,
              unitPrice: inventory.ingredient.costPerUnit || 0
            }]
          }
        }
      });
      console.log(`[Auto-Reorder] Created new Draft PO for ${inventory.ingredient.name}`);
    }
  }
}
