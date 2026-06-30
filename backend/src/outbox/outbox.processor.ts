import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { OrderCreatedEvent } from '../orders/events/order-created.event';
import { OrderVoidedEvent } from '../orders/events/order-voided.event';
import { OrderRefundedEvent } from '../orders/events/order-refunded.event';
import { OrderStatusUpdatedEvent } from '../orders/events/order-status-updated.event';
import { PurchaseOrderReceivedEvent } from '../procurement/events/purchase-order-received.event';
import { ProductionCompletedEvent } from '../production/events/production-completed.event';
import { Order, OrderStatus } from '@prisma/client';
import { MAX_OUTBOX_ATTEMPTS, OUTBOX_BATCH_SIZE } from './outbox.constants';

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron('*/10 * * * * *')
  async handleCron() {
    const events = await this.prisma.outboxEvent.findMany({
      where: {
        OR: [
          { status: 'PENDING' },
          {
            status: 'FAILED',
            attempts: { lt: MAX_OUTBOX_ATTEMPTS },
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: OUTBOX_BATCH_SIZE,
    });

    for (const event of events) {
      const claimed = await this.prisma.outboxEvent.updateMany({
        where: {
          id: event.id,
          status: event.status,
          attempts: event.attempts,
        },
        data: {
          status: 'PROCESSING',
          attempts: { increment: 1 },
        },
      });

      if (claimed.count === 0) continue;

      try {
        await this.dispatch(event.eventType, event.payload);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
            lastError: null,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const updated = await this.prisma.outboxEvent.findUnique({
          where: { id: event.id },
        });
        const attempts = updated?.attempts ?? MAX_OUTBOX_ATTEMPTS;
        const willRetry = attempts < MAX_OUTBOX_ATTEMPTS;

        this.logger.error(
          `Outbox event ${event.id} (${event.eventType}) failed (attempt ${attempts}/${MAX_OUTBOX_ATTEMPTS}): ${message}`,
        );

        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: willRetry ? 'PENDING' : 'FAILED',
            lastError: message,
          },
        });
      }
    }
  }

  private async dispatch(eventType: string, payload: unknown) {
    if (eventType === 'order.created') {
      const data = payload as {
        order: Order;
        ingredientRequirements: [number, number][];
        branchId: number;
        customerId: number | null;
      };
      const map = new Map<number, number>(data.ingredientRequirements);
      await this.eventEmitter.emitAsync(
        'order.created',
        new OrderCreatedEvent(data.order, map, data.branchId, data.customerId),
      );
      return;
    }

    if (eventType === 'order.status.updated') {
      const data = payload as {
        orderId: number;
        status: OrderStatus;
        branchId: number;
      };
      await this.eventEmitter.emitAsync(
        'order.status.updated',
        new OrderStatusUpdatedEvent(data.orderId, data.status, data.branchId),
      );
      return;
    }

    if (eventType === 'order.voided') {
      const data = payload as { order: Order };
      await this.eventEmitter.emitAsync(
        'order.voided',
        new OrderVoidedEvent(data.order),
      );
      return;
    }

    if (eventType === 'order.refunded') {
      const data = payload as { order: Order; reason?: string };
      await this.eventEmitter.emitAsync(
        'order.refunded',
        new OrderRefundedEvent(data.order, data.reason),
      );
      return;
    }

    if (eventType === 'purchase-order.received') {
      const data = payload as {
        poId: number;
        poNumber: string;
        branchId: number;
        totalAmount: number;
      };
      await this.eventEmitter.emitAsync(
        'purchase-order.received',
        new PurchaseOrderReceivedEvent(
          data.poId,
          data.poNumber,
          data.branchId,
          data.totalAmount,
        ),
      );
      return;
    }

    if (eventType === 'production.completed') {
      const data = payload as {
        orderNumber: string;
        targetIngredientName: string;
        branchId: number;
        totalRawCost: number;
      };
      await this.eventEmitter.emitAsync(
        'production.completed',
        new ProductionCompletedEvent(
          data.orderNumber,
          data.targetIngredientName,
          data.branchId,
          data.totalRawCost,
        ),
      );
      return;
    }

    throw new Error(`Unhandled outbox event type: ${eventType}`);
  }
}
