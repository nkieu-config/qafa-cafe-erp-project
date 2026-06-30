import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { PaymentMethod, OrderStatus, Customer, Prisma } from '@prisma/client';
import { InventoryHelper } from './helpers/inventory.helper';
import { OutboxService } from '../outbox/outbox.service';
import { SettingsService } from '../settings/settings.service';
import { toNum, roundMoney } from '../common/decimal.util';
import { inclusiveTaxAmount } from '../common/vat.util';
import {
  assertBranchAccess,
  BranchScopedUser,
} from '../auth/branch-scope.util';
import { pointsToDiscountBaht } from '../customers/loyalty.constants';
import {
  productRequiresKitchen,
  resolveInitialOrderStatus,
} from './order-status.util';
import {
  buildItemIngredientRequirements,
  mergeRequirementMaps,
} from './helpers/recipe-requirements.helper';
import { isSameCalendarDay, isTerminalOrderStatus } from './order-void.util';
import { allocateQueueNumber } from './helpers/queue-number.helper';
import { kdsOrderInclude } from './kds-order.include';
import {
  applyOrderReversalEffects,
  ORDER_REVERSAL_INCLUDE,
} from './helpers/order-reversal.helper';
import { assertRefundable } from './helpers/order-refund.util';

const OPERATIONAL_ORDER_STATUSES: readonly OrderStatus[] = [
  'PENDING',
  'PREPARING',
  'COMPLETED',
];
const MAX_QUEUE_NUMBER_RETRIES = 2;
const createOrderInclude = {
  ...kdsOrderInclude,
  promotion: true,
} satisfies Prisma.OrderInclude;

type CreateOrderInput = {
  userId: number;
  branchId: number;
  items: {
    productId: number;
    quantity: number;
    notes?: string;
    modifierOptionIds?: number[];
  }[];
  customerPhone?: string;
  promotionCode?: string;
  pointsToRedeem?: number;
  paymentMethod?: PaymentMethod;
  isTaxInvoiceRequested?: boolean;
  taxInvoiceName?: string;
  taxInvoiceTaxId?: string;
  taxInvoiceAddress?: string;
};
type CreatedOrder = Prisma.OrderGetPayload<{
  include: typeof createOrderInclude;
}>;

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private outboxService: OutboxService,
    private settingsService: SettingsService,
  ) {}

  async createOrder(data: CreateOrderInput): Promise<CreatedOrder> {
    return await this.createOrderWithQueueRetry(data);
  }

  private async createOrderWithQueueRetry(
    data: CreateOrderInput,
    attempt = 0,
  ): Promise<CreatedOrder> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        let totalCogs = 0;

        const ingredientRequirements = new Map<number, number>();
        const productsForStatus: { category: string }[] = [];
        const processedItems: {
          productId: number;
          quantity: number;
          unitPrice: number;
          notesText?: string;
          modifiers: {
            optionId: number;
            optionName: string;
            priceDelta: number;
          }[];
        }[] = [];

        for (const item of data.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: { recipeItems: { include: { ingredient: true } } },
          });

          if (!product)
            throw new BadRequestException(
              `Product with ID ${item.productId} not found`,
            );

          productsForStatus.push(product);

          if (
            productRequiresKitchen(product.category) &&
            product.recipeItems.length === 0
          ) {
            throw new BadRequestException(
              `Product "${product.name}" requires a recipe before it can be sold.`,
            );
          }

          let unitPrice = toNum(product.price);
          const modifiers: {
            optionId: number;
            optionName: string;
            priceDelta: number;
          }[] = [];
          const modifierLabels: string[] = [];
          let selectedOptions: {
            swapToIngredientId: number | null;
            group: { swapIngredientId: number | null };
          }[] = [];

          if (item.modifierOptionIds?.length) {
            const options = await tx.modifierOption.findMany({
              where: { id: { in: item.modifierOptionIds } },
              include: { group: true },
            });
            if (options.length !== item.modifierOptionIds.length) {
              throw new BadRequestException('Invalid modifier selection');
            }
            selectedOptions = options;
            for (const opt of options) {
              const delta = toNum(opt.priceDelta);
              unitPrice += delta;
              const label = `${opt.group.name}: ${opt.name}`;
              modifierLabels.push(label);
              modifiers.push({
                optionId: opt.id,
                optionName: label,
                priceDelta: delta,
              });
            }
          }

          totalAmount += unitPrice * item.quantity;

          const recipeRows = product.recipeItems.map((recipe) => ({
            ingredientId: recipe.ingredientId,
            quantity: recipe.quantity,
          }));
          const itemRequirements = buildItemIngredientRequirements(
            recipeRows,
            item.quantity,
            selectedOptions,
          );
          mergeRequirementMaps(ingredientRequirements, itemRequirements);

          const costByIngredient = new Map(
            product.recipeItems.map((recipe) => [
              recipe.ingredientId,
              toNum(recipe.ingredient.costPerUnit),
            ]),
          );
          const missingCostIds = [...itemRequirements.keys()].filter(
            (id) => !costByIngredient.has(id),
          );
          if (missingCostIds.length > 0) {
            const extraIngredients = await tx.ingredient.findMany({
              where: { id: { in: missingCostIds } },
            });
            for (const ing of extraIngredients) {
              costByIngredient.set(ing.id, toNum(ing.costPerUnit));
            }
          }
          for (const [ingredientId, qty] of itemRequirements.entries()) {
            totalCogs += (costByIngredient.get(ingredientId) ?? 0) * qty;
          }

          const notesText =
            [item.notes, modifierLabels.join(', ')]
              .filter(Boolean)
              .join(' | ') || undefined;

          processedItems.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: roundMoney(unitPrice),
            notesText,
            modifiers,
          });
        }

        // Check and Deduct Inventory using external Helper to enforce Boundaries
        await InventoryHelper.deductInventoryFIFO(
          tx,
          data.branchId,
          ingredientRequirements,
        );

        // CRM & Promotions Logic
        let discountAmount = 0;
        const pointsRedeemed = data.pointsToRedeem || 0;
        let customerId: number | null = null;
        let promotionId: number | null = null;

        let customer: Customer | null = null;
        if (data.customerPhone) {
          customer = await tx.customer.findUnique({
            where: { phone: data.customerPhone },
          });
          if (!customer) throw new BadRequestException('Customer not found');
          customerId = customer.id;

          if (pointsRedeemed > 0) {
            if (customer.points < pointsRedeemed)
              throw new BadRequestException('Not enough points to redeem');
            discountAmount += pointsToDiscountBaht(pointsRedeemed);
            await tx.customer.update({
              where: { id: customer.id },
              data: { points: { decrement: pointsRedeemed } },
            });
          }
        } else if (pointsRedeemed > 0) {
          throw new BadRequestException(
            'Must provide customer phone to redeem points',
          );
        }

        if (data.promotionCode) {
          const promo = await tx.promotion.findUnique({
            where: { code: data.promotionCode },
          });
          if (!promo || !promo.isActive)
            throw new BadRequestException('Invalid or inactive promotion');

          const now = new Date();
          if (promo.startDate && now < promo.startDate)
            throw new BadRequestException('Promotion not started yet');
          if (promo.endDate && now > promo.endDate)
            throw new BadRequestException('Promotion expired');
          if (promo.minPurchase && totalAmount < toNum(promo.minPurchase))
            throw new BadRequestException(
              `Minimum purchase of ${toNum(promo.minPurchase)} required`,
            );

          promotionId = promo.id;
          let promoDiscount = 0;
          if (promo.discountType === 'PERCENTAGE') {
            promoDiscount = totalAmount * (toNum(promo.discountValue) / 100);
          } else {
            promoDiscount = toNum(promo.discountValue);
          }

          discountAmount += promoDiscount;
        }

        discountAmount = Math.min(
          roundMoney(discountAmount),
          roundMoney(totalAmount),
        );
        const netAmount = roundMoney(totalAmount - discountAmount);
        const vatRate = await this.settingsService.getVatRatePercent();
        const taxAmount = inclusiveTaxAmount(netAmount, vatRate);
        const pointsEarned = customer ? Math.floor(netAmount / 100) : 0;

        if (customer && pointsEarned > 0) {
          await tx.customer.update({
            where: { id: customer.id },
            data: { points: { increment: pointsEarned } },
          });
        }

        const orderStatus = resolveInitialOrderStatus(productsForStatus);
        const { queueNumber, queueDate } = await allocateQueueNumber(
          tx,
          data.branchId,
        );

        const order = await tx.order.create({
          data: {
            userId: data.userId,
            branchId: data.branchId,
            status: orderStatus,
            queueNumber,
            queueDate,
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
              create: processedItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.unitPrice,
                notes: item.notesText,
                modifiers: item.modifiers.length
                  ? {
                      create: item.modifiers.map((m) => ({
                        optionId: m.optionId,
                        optionName: m.optionName,
                        priceDelta: m.priceDelta,
                      })),
                    }
                  : undefined,
              })),
            },
          },
          include: createOrderInclude,
        });

        await this.outboxService.enqueue(tx, 'order.created', {
          order,
          ingredientRequirements: Array.from(ingredientRequirements.entries()),
          branchId: data.branchId,
          customerId,
        });

        return order;
      });
    } catch (err) {
      if (
        this.isQueueNumberConflict(err) &&
        attempt < MAX_QUEUE_NUMBER_RETRIES
      ) {
        return this.createOrderWithQueueRetry(data, attempt + 1);
      }
      throw err;
    }
  }

  private isQueueNumberConflict(err: unknown): boolean {
    if (
      !(err instanceof Prisma.PrismaClientKnownRequestError) ||
      err.code !== 'P2002'
    ) {
      return false;
    }

    const target = err.meta?.target;
    return Array.isArray(target) && target.includes('queueNumber');
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: { items: true, branch: true, customer: true, promotion: true },
      orderBy: { createdAt: 'desc' },
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
        status: { in: ['PENDING', 'PREPARING'] },
      },
      include: kdsOrderInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
    user?: BranchScopedUser,
  ) {
    if (!OPERATIONAL_ORDER_STATUSES.includes(status)) {
      throw new BadRequestException(
        'Use void or refund endpoints for terminal order statuses.',
      );
    }

    const existing = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
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

  async voidOrder(orderId: number, user?: BranchScopedUser) {
    const existing = await this.loadOrderForReversal(orderId, user);

    if (isTerminalOrderStatus(existing.status)) {
      throw new BadRequestException('Order is already voided or refunded.');
    }

    if (!isSameCalendarDay(existing.createdAt, new Date())) {
      throw new BadRequestException(
        'Only same-day orders can be voided. Use refund flow for older orders.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await applyOrderReversalEffects(tx, existing);

      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: {
          items: { include: { product: true } },
          customer: true,
          promotion: true,
        },
      });

      await this.outboxService.enqueue(tx, 'order.voided', { order });
      await this.outboxService.enqueue(tx, 'order.status.updated', {
        orderId: order.id,
        status: order.status,
        branchId: existing.branchId,
      });

      return order;
    });
  }

  async refundOrder(orderId: number, reason?: string, user?: BranchScopedUser) {
    const existing = await this.loadOrderForReversal(orderId, user);

    try {
      assertRefundable(existing.createdAt, existing.status);
    } catch (err) {
      throw this.mapRefundError(err);
    }

    return this.prisma.$transaction(async (tx) => {
      await applyOrderReversalEffects(tx, existing);

      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'REFUNDED',
          refundReason: reason?.trim() || null,
          refundedAt: new Date(),
        },
        include: {
          items: { include: { product: true } },
          customer: true,
          promotion: true,
        },
      });

      await this.outboxService.enqueue(tx, 'order.refunded', {
        order,
        reason: reason?.trim(),
      });
      await this.outboxService.enqueue(tx, 'order.status.updated', {
        orderId: order.id,
        status: order.status,
        branchId: existing.branchId,
      });

      return order;
    });
  }

  private async loadOrderForReversal(orderId: number, user?: BranchScopedUser) {
    const existing = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_REVERSAL_INCLUDE,
    });

    if (!existing) throw new NotFoundException('Order not found');
    if (user) assertBranchAccess(user, existing.branchId);
    return existing;
  }

  private mapRefundError(err: unknown): BadRequestException {
    const code = err instanceof Error ? err.message : String(err);
    switch (code) {
      case 'ORDER_ALREADY_REVERSED':
        return new BadRequestException('Order is already voided or refunded.');
      case 'REFUND_NOT_COMPLETED':
        return new BadRequestException(
          'Only completed orders can be refunded.',
        );
      case 'REFUND_SAME_DAY':
        return new BadRequestException(
          'Same-day orders should be voided, not refunded.',
        );
      default:
        return new BadRequestException('Order cannot be refunded.');
    }
  }
}
