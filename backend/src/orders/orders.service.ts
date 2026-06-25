import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { PaymentMethod, OrderStatus, Customer } from '@prisma/client';
import { InventoryHelper } from './helpers/inventory.helper';
import { OutboxService } from '../outbox/outbox.service';
import { toNum, roundMoney } from '../common/decimal.util';
import { assertBranchAccess, BranchScopedUser } from '../auth/branch-scope.util';
import { pointsToDiscountBaht } from '../customers/loyalty.constants';
import {
  productRequiresKitchen,
  resolveInitialOrderStatus,
} from './order-status.util';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private outboxService: OutboxService,
  ) {}

  async createOrder(data: { 
    userId: number; 
    branchId: number; 
    items: { productId: number; quantity: number; notes?: string }[];
    customerPhone?: string;
    promotionCode?: string;
    pointsToRedeem?: number;
    paymentMethod?: PaymentMethod;
    isTaxInvoiceRequested?: boolean;
    taxInvoiceName?: string;
    taxInvoiceTaxId?: string;
    taxInvoiceAddress?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let totalCogs = 0;

      const ingredientRequirements = new Map<number, number>();
      const productsForStatus: { category: string }[] = [];

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { recipeItems: { include: { ingredient: true } } },
        });

        if (!product) throw new BadRequestException(`Product with ID ${item.productId} not found`);

        productsForStatus.push(product);

        if (productRequiresKitchen(product.category) && product.recipeItems.length === 0) {
          throw new BadRequestException(
            `Product "${product.name}" requires a recipe before it can be sold.`,
          );
        }

        totalAmount += toNum(product.price) * item.quantity;

        for (const recipe of product.recipeItems) {
          const totalNeeded = recipe.quantity * item.quantity;
          const currentNeeded = ingredientRequirements.get(recipe.ingredientId) || 0;
          ingredientRequirements.set(recipe.ingredientId, currentNeeded + totalNeeded);
          
          totalCogs += toNum(recipe.ingredient.costPerUnit) * totalNeeded;
        }
      }

      // Check and Deduct Inventory using external Helper to enforce Boundaries
      await InventoryHelper.deductInventoryFIFO(tx, data.branchId, ingredientRequirements);

      // CRM & Promotions Logic
      let discountAmount = 0;
      let pointsRedeemed = data.pointsToRedeem || 0;
      let customerId: number | null = null;
      let promotionId: number | null = null;
      
      let customer: Customer | null = null;
      if (data.customerPhone) {
        customer = await tx.customer.findUnique({ where: { phone: data.customerPhone } });
        if (!customer) throw new BadRequestException('Customer not found');
        customerId = customer.id;
        
        if (pointsRedeemed > 0) {
          if (customer.points < pointsRedeemed) throw new BadRequestException('Not enough points to redeem');
          discountAmount += pointsToDiscountBaht(pointsRedeemed);
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
        if (promo.minPurchase && totalAmount < toNum(promo.minPurchase)) throw new BadRequestException(`Minimum purchase of ${promo.minPurchase} required`);
        
        promotionId = promo.id;
        let promoDiscount = 0;
        if (promo.discountType === 'PERCENTAGE') {
          promoDiscount = totalAmount * (toNum(promo.discountValue) / 100);
        } else {
          promoDiscount = toNum(promo.discountValue);
        }
        
        discountAmount += promoDiscount;
      }
      
      discountAmount = Math.min(roundMoney(discountAmount), roundMoney(totalAmount));
      const netAmount = roundMoney(totalAmount - discountAmount);
      const taxAmount = roundMoney((netAmount * 7) / 107); // VAT 7% Inclusive
      const pointsEarned = customer ? Math.floor(netAmount / 100) : 0;
      
      if (customer && pointsEarned > 0) {
        // Point updates are decoupled and handled in CustomersService asynchronously
        // via the order.created event to reduce checkout latency.
      }

      const orderStatus = resolveInitialOrderStatus(productsForStatus);

      const order = await tx.order.create({
        data: {
          userId: data.userId,
          branchId: data.branchId,
          status: orderStatus,
          totalAmount: roundMoney(totalAmount),
          discountAmount,
          netAmount,
          taxAmount,
          totalCogs: roundMoney(totalCogs),
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
                notes: item.notes,
              };
            }))
          }
        },
        include: { items: { include: { product: true } }, customer: true, promotion: true },
      });

      await this.outboxService.enqueue(tx, 'order.created', {
        order,
        ingredientRequirements: Array.from(ingredientRequirements.entries()),
        branchId: data.branchId,
        customerId,
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

  async findByBranch(branchId: number) {
    return this.prisma.order.findMany({
      where: { branchId },
      include: { items: true, branch: true, customer: true, promotion: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, user?: BranchScopedUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, branch: true, customer: true, promotion: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (user) assertBranchAccess(user, order.branchId);
    return order;
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

  async updateOrderStatus(orderId: number, status: OrderStatus, user?: BranchScopedUser) {
    const existing = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) throw new NotFoundException('Order not found');
    if (user) assertBranchAccess(user, existing.branchId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status },
      });

      await this.outboxService.enqueue(tx, 'order.status.updated', {
        orderId: order.id,
        status: order.status,
        branchId: existing.branchId,
      });

      return order;
    });

    return updated;
  }
}
