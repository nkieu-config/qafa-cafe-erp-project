import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { OutboxProcessor } from '../src/outbox/outbox.processor';
import { InventoryBatchExpiryProcessor } from '../src/inventory/inventory-batch-expiry.processor';

export async function createE2eApp(): Promise<INestApplication<App>> {
  process.env.JWT_SECRET =
    process.env.JWT_SECRET ?? 'test-jwt-secret-for-e2e-only-32chars';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(OutboxProcessor)
    .useValue({ handleCron: jest.fn() })
    .overrideProvider(InventoryBatchExpiryProcessor)
    .useValue({ markExpiredBatches: jest.fn() })
    .compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

export async function processOutboxOnce(
  app: INestApplication<App>,
): Promise<void> {
  const processor = app.get(OutboxProcessor);
  await processor.handleCron();
}
