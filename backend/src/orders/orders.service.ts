import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { ProcurementService } from '../procurement/procurement.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService, private eventsGateway: EventsGateway, private procurementService: ProcurementService) {}

  async createOrder(data: { 
    userId: number; 
    branchId: number; 
    items: { productId: number; quantity: number }[];
    customerPhone?: string;
    promotionCode?: string;
    pointsToRedeem?: number;
    paymentMethod?: any;
    isTaxInvoiceRequested?: boolean;
    taxInvoiceName?: string;
    taxInvoiceTaxId?: string;
    taxInvoiceAddress?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let totalCogs = 0;

      const ingredientRequirements = new Map<number, number>();

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { recipeItems: { include: { ingredient: true } } },
        });

        if (!product) throw new BadRequestException(`Product with ID ${item.productId} not found`);

        totalAmount += product.price * item.quantity;

        for (const recipe of product.recipeItems) {
          const totalNeeded = recipe.quantity * item.quantity;
          const currentNeeded = ingredientRequirements.get(recipe.ingredientId) || 0;
          ingredientRequirements.set(recipe.ingredientId, currentNeeded + totalNeeded);
          
          totalCogs += (recipe.ingredient.costPerUnit * totalNeeded);
        }
      }

      // Check and Deduct Inventory
      for (const [ingredientId, neededQty] of ingredientRequirements.entries()) {
        const branchInventory = await tx.branchInventory.findUnique({
          where: { branchId_ingredientId: { branchId: data.branchId, ingredientId } },
          include: { ingredient: true }
        });

        if (!branchInventory || branchInventory.stock < neededQty) {
          const name = branchInventory?.ingredient?.name || `ID ${ingredientId}`;
          throw new BadRequestException(`Not enough stock for ${name} at this branch.`);
        }

        // Deduct from BranchInventory (Cache)
        await tx.branchInventory.update({
          where: { id: branchInventory.id },
          data: { stock: branchInventory.stock - neededQty },
        });

        // FIFO Deduction from InventoryBatch
        let remainingToDeduct = neededQty;
        const activeBatches = await tx.inventoryBatch.findMany({
          where: { branchId: data.branchId, ingredientId, status: 'ACTIVE' },
          orderBy: [{ expiryDate: 'asc' }, { createdAt: 'asc' }]
        });

        for (const batch of activeBatches) {
          if (remainingToDeduct <= 0) break;

          if (batch.quantity <= remainingToDeduct) {
            remainingToDeduct -= batch.quantity;
            await tx.inventoryBatch.update({ where: { id: batch.id }, data: { quantity: 0, status: 'DEPLETED' } });
          } else {
            await tx.inventoryBatch.update({ where: { id: batch.id }, data: { quantity: batch.quantity - remainingToDeduct } });
            remainingToDeduct = 0;
          }
        }

        if (remainingToDeduct > 0) {
          // Fallback: If physical stock is there but batches weren't registered by staff,
          // we allow the POS sale to continue. The aggregate stock was already deducted.
          // In a mature system, we could log this to a "Virtual Negative Batch" or audit log.
          console.warn(`[FIFO Warning] Batches out of sync for ingredient ${ingredientId} at branch ${data.branchId}. Missing ${remainingToDeduct} units.`);
        }
      }

      // CRM & Promotions Logic
      let discountAmount = 0;
      let pointsRedeemed = data.pointsToRedeem || 0;
      let customerId: number | null = null;
      let promotionId: number | null = null;
      
      let customer: any = null;
      if (data.customerPhone) {
        customer = await tx.customer.findUnique({ where: { phone: data.customerPhone } });
        if (!customer) throw new BadRequestException('Customer not found');
        customerId = customer.id;
        
        if (pointsRedeemed > 0) {
          if (customer.points < pointsRedeemed) throw new BadRequestException('Not enough points to redeem');
          discountAmount += pointsRedeemed / 10; // 10 points = 1 THB
          await tx.customer.update({
            where: { id: customer.id },
            data: { points: { decrement: pointsRedeemed } }
          });
        }
      } else if (pointsRedeemed > 0) {
        throw new BadRequestException('Must provide customer phone to redeem points');
      }

      if (data.promotionCode) {
        const promo = await tx.promotion.findUnique({ where: { code: data.promotionCode } });
        if (!promo || !promo.isActive) throw new BadRequestException('Invalid or inactive promotion');
        
        const now = new Date();
        if (promo.startDate && now < promo.startDate) throw new BadRequestException('Promotion not started yet');
        if (promo.endDate && now > promo.endDate) throw new BadRequestException('Promotion expired');
        if (promo.minPurchase && totalAmount < promo.minPurchase) throw new BadRequestException(`Minimum purchase of ${promo.minPurchase} required`);
        
        promotionId = promo.id;
        let promoDiscount = 0;
        if (promo.discountType === 'PERCENTAGE') {
          promoDiscount = totalAmount * (promo.discountValue / 100);
        } else {
          promoDiscount = promo.discountValue;
        }
        
        discountAmount += promoDiscount;
      }
      
      discountAmount = Math.min(discountAmount, totalAmount);
      const netAmount = totalAmount - discountAmount;
      const taxAmount = (netAmount * 7) / 107; // VAT 7% Inclusive
      const pointsEarned = customer ? Math.floor(netAmount / 100) : 0;
      
      if (customer && pointsEarned > 0) {
        await tx.customer.update({
          where: { id: customer.id },
          data: { points: { increment: pointsEarned } }
        });
      }

      const order = await tx.order.create({
        data: {
          userId: data.userId,
          branchId: data.branchId,
          totalAmount,
          discountAmount,
          netAmount,
          taxAmount,
          totalCogs,
          pointsEarned,
          pointsRedeemed,
          customerId,
          promotionId,
          paymentMethod: data.paymentMethod || 'CASH',
          isTaxInvoiceRequested: data.isTaxInvoiceRequested || false,
          taxInvoiceName: data.taxInvoiceName,
          taxInvoiceTaxId: data.taxInvoiceTaxId,
          taxInvoiceAddress: data.taxInvoiceAddress,
          items: {
            create: await Promise.all(data.items.map(async (item) => {
              const product = await tx.product.findUnique({ where: { id: item.productId } });
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: product!.price,
              };
            }))
          }
        },
        include: { items: { include: { product: true } }, customer: true, promotion: true },
      });

      // Emit WebSocket event for KDS
      this.eventsGateway.emitOrderCreated(order);

      // Async trigger Auto-Reorder checks
      setTimeout(() => {
        for (const ingredientId of ingredientRequirements.keys()) {
          this.procurementService.checkAndAutoReorder(data.branchId, ingredientId).catch(err => console.error(err));
        }
      }, 0);

      return order;
    });
  }

  async findAll() {
    return this.prisma.order.findMany({ 
      include: { items: true, branch: true, customer: true, promotion: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: number) {
    return this.prisma.order.findUnique({ 
      where: { id }, 
      include: { items: true, branch: true, customer: true, promotion: true } 
    });
  }

  // ==================== KDS (Kitchen Display System) ====================
  async getKdsOrders(branchId: number) {
    return this.prisma.order.findMany({
      where: { 
        branchId,
        status: { in: ['PENDING', 'PREPARING'] } 
      },
      include: { 
        items: { include: { product: true } }, 
        customer: true 
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async updateOrderStatus(orderId: number, status: any) {
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
    
    // Emit WebSocket event to notify clients (POS/KDS)
    this.eventsGateway.emitOrderStatusUpdated(orderId, status);
    
    return updated;
  }
}
