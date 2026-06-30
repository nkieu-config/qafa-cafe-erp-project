import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProductionService } from './production.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  MockPrismaService,
  PrismaServiceMockProvider,
} from '../prisma/prisma.service.mock';
import { OutboxService } from '../outbox/outbox.service';

describe('ProductionService', () => {
  let service: ProductionService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        PrismaServiceMockProvider,
        {
          provide: OutboxService,
          useValue: { enqueue: jest.fn().mockResolvedValue({ id: 1 }) },
        },
      ],
    }).compile();

    service = module.get(ProductionService);
    prisma = module.get(PrismaService);
  });

  it('rejects direct completion through generic status updates', async () => {
    await expect(
      service.updateOrderStatus(1, 'COMPLETED', {
        userId: 1,
        role: 'MANAGER',
        branchId: 2,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.productionOrder.findUnique).not.toHaveBeenCalled();
  });
});
