import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { OrderCreatedEvent } from '../orders/events/order-created.event';
import { Order } from '@prisma/client';

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
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    for (const event of events) {
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: 'PROCESSING', attempts: { increment: 1 } },
      });

      try {
        await this.dispatch(event.eventType, event.payload);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { status: 'COMPLETED', processedAt: new Date(), lastError: null },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Outbox event ${event.id} failed: ${message}`);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { status: 'FAILED', lastError: message },
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
      this.eventEmitter.emit(
        'order.created',
        new OrderCreatedEvent(data.order, map, data.branchId, data.customerId),
      );
      return;
    }

    throw new Error(`Unhandled outbox event type: ${eventType}`);
  }
}
