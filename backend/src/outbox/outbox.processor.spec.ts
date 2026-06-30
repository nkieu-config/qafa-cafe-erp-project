import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OutboxProcessor } from './outbox.processor';
import { PrismaService } from '../prisma/prisma.service';
import { MAX_OUTBOX_ATTEMPTS } from './outbox.constants';

describe('OutboxProcessor', () => {
  let processor: OutboxProcessor;
  let prisma: {
    outboxEvent: {
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let eventEmitter: { emitAsync: jest.Mock };

  beforeEach(async () => {
    prisma = {
      outboxEvent: {
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn(),
      },
    };
    eventEmitter = { emitAsync: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    processor = module.get(OutboxProcessor);
  });

  it('marks event completed after successful dispatch', async () => {
    prisma.outboxEvent.findMany.mockResolvedValue([
      {
        id: 1,
        eventType: 'order.created',
        status: 'PENDING',
        attempts: 0,
        payload: {
          order: { id: 1 },
          ingredientRequirements: [],
          branchId: 1,
          customerId: null,
        },
      },
    ]);
    prisma.outboxEvent.findUnique.mockResolvedValue({ attempts: 1 });

    await processor.handleCron();

    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      'order.created',
      expect.any(Object),
    );
    expect(prisma.outboxEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ status: 'COMPLETED' }),
      }),
    );
  });

  it('schedules retry when dispatch fails under max attempts', async () => {
    prisma.outboxEvent.findMany.mockResolvedValue([
      {
        id: 2,
        eventType: 'order.status.updated',
        status: 'PENDING',
        attempts: 1,
        payload: { orderId: 9, status: 'COMPLETED', branchId: 1 },
      },
    ]);
    prisma.outboxEvent.findUnique.mockResolvedValue({ attempts: 2 });
    eventEmitter.emitAsync.mockRejectedValue(new Error('handler down'));

    await processor.handleCron();

    expect(prisma.outboxEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2 },
        data: expect.objectContaining({
          status: 'PENDING',
          lastError: 'handler down',
        }),
      }),
    );
  });

  it('skips events already claimed by another processor', async () => {
    prisma.outboxEvent.findMany.mockResolvedValue([
      {
        id: 4,
        eventType: 'order.status.updated',
        status: 'PENDING',
        attempts: 0,
        payload: { orderId: 9, status: 'COMPLETED', branchId: 1 },
      },
    ]);
    prisma.outboxEvent.updateMany.mockResolvedValue({ count: 0 });

    await processor.handleCron();

    expect(eventEmitter.emitAsync).not.toHaveBeenCalled();
  });

  it('marks permanently failed after max attempts', async () => {
    prisma.outboxEvent.findMany.mockResolvedValue([
      {
        id: 3,
        eventType: 'order.created',
        status: 'FAILED',
        attempts: MAX_OUTBOX_ATTEMPTS - 1,
        payload: {},
      },
    ]);
    prisma.outboxEvent.findUnique.mockResolvedValue({
      attempts: MAX_OUTBOX_ATTEMPTS,
    });
    eventEmitter.emitAsync.mockRejectedValue(new Error('still failing'));

    await processor.handleCron();

    expect(prisma.outboxEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 3 },
        data: expect.objectContaining({ status: 'FAILED' }),
      }),
    );
  });
});
