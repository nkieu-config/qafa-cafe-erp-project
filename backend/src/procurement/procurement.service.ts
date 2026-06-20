import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class ProcurementService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private accountingService: AccountingService
  ) {}

  findAllSuppliers() {
    return this.prisma.supplier.findMany();
  }

  findAllPOs() {
    return this.prisma.purchaseOrder.findMany({
      include: { supplier: true, branch: true, items: { include: { ingredient: true } } },
      orderBy: { createdAt: 'desc' }
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

  async approvePO(poId: number, userId: number) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw new BadRequestException('PO not found');
    if (po.status !== 'PENDING') throw new BadRequestException(`Cannot approve PO with status ${po.status}`);

    const updatedPo = await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'APPROVED' }
    });

    await this.auditService.logAction(userId, 'APPROVE_PO', 'PurchaseOrder', poId, { poNumber: po.poNumber });
    return updatedPo;
  }

  async rejectPO(poId: number, userId: number) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw new BadRequestException('PO not found');
    if (po.status !== 'PENDING') throw new BadRequestException(`Cannot reject PO with status ${po.status}`);

    const updatedPo = await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'DRAFT' } // Send back to draft or Cancelled. Using DRAFT so it can be edited.
    });

    await this.auditService.logAction(userId, 'REJECT_PO', 'PurchaseOrder', poId, { poNumber: po.poNumber });
    return updatedPo;
  }

  async receivePO(poId: number, userId?: number, expiryDates?: { ingredientId: number, date: string }[]) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true }
      });

      if (!po) throw new BadRequestException('PO not found');
      if (po.status === 'RECEIVED') throw new BadRequestException('PO already received');
      if (po.status !== 'APPROVED') throw new BadRequestException('PO must be APPROVED before receiving items');

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

      // Calculate Total Amount
      const totalAmount = po.items.reduce((sum, item) => sum + (item.quantityRequested * item.unitPrice), 0);

      // Post Accounts Payable (AP) Journal Entry
      if (totalAmount > 0) {
        this.accountingService.createJournalEntry({
          reference: po.poNumber,
          description: `Accounts Payable for PO ${po.poNumber}`,
          lines: [
            { accountCode: '1030', debit: totalAmount, credit: 0, description: 'Inventory received' },
            { accountCode: '2010', debit: 0, credit: totalAmount, description: 'Accounts Payable recognized' }
          ]
        }).catch(err => console.error('[Accounting] Failed to post AP journal entry:', err));
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
