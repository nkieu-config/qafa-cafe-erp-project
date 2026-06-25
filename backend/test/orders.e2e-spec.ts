import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp } from './e2e-app.util';
import {
  cleanupPosFixture,
  E2E_PASSWORD,
  seedPosFixture,
} from './e2e-fixtures.util';

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('POS order flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let fixture: Awaited<ReturnType<typeof seedPosFixture>>;

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    fixture = await seedPosFixture(prisma);
  });

  afterAll(async () => {
    await cleanupPosFixture(prisma, fixture.email);
    await app?.close();
  });

  it('creates a paid order and deducts branch stock', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/auth/login')
      .send({ email: fixture.email, password: E2E_PASSWORD })
      .expect(200);

    const orderRes = await agent
      .post('/orders')
      .send({
        branchId: fixture.branch.id,
        items: [{ productId: fixture.product.id, quantity: 2 }],
        paymentMethod: 'CASH',
      })
      .expect(201);

    expect(orderRes.body.netAmount).toBeDefined();
    expect(orderRes.body.status).toBe('PENDING');

    const inventory = await prisma.branchInventory.findFirst({
      where: {
        branchId: fixture.branch.id,
        ingredientId: fixture.ingredient.id,
      },
    });

    expect(inventory?.stock).toBe(960);
  });
});
