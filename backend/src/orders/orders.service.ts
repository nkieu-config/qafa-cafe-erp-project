import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(data: { 
    userId: number; 
    branchId: number; 
    items: { productId: number; quantity: number }[];
    customerPhone?: string;
    promotionCode?: string;
    pointsToRedeem?: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;

      const ingredientRequirements = new Map<number, number>();

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { recipeItems: true },
        });

        if (!product) throw new BadRequestException(`Product with ID ${item.productId} not found`);

        totalAmount += product.price * item.quantity;

        for (const recipe of product.recipeItems) {
          const totalNeeded = recipe.quantity * item.quantity;
          const currentNeeded = ingredientRequirements.get(recipe.ingredientId) || 0;
          ingredientRequirements.set(recipe.ingredientId, currentNeeded + totalNeeded);
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
          throw new BadRequestException(`Inventory batches out of sync for ingredient ID ${ingredientId}`);
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
          pointsEarned,
          pointsRedeemed,
          customerId,
          promotionId,
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
        include: { items: true, customer: true, promotion: true },
      });

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
}
