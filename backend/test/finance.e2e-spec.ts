import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp } from './e2e-app.util';
import { E2E_PASSWORD } from './e2e-fixtures.util';

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('Finance settlement flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const email = 'finance-mgr@e2e.test';
  let branchId: number;

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);

    const branch = await prisma.branch.create({
      data: { name: 'E2E Finance Branch', location: 'Bangkok' },
    });
    branchId = branch.id;

    await prisma.user.create({
      data: {
        email,
        name: 'Finance Manager',
        password: await bcrypt.hash(E2E_PASSWORD, 10),
        role: 'MANAGER',
        branchId,
      },
    });
  });

  afterAll(async () => {
    await prisma.shiftSettlement.deleteMany({ where: { branchId } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.branch.deleteMany({ where: { name: 'E2E Finance Branch' } });
    await app?.close();
  });

  it('submits settlement for own branch', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/auth/login')
      .send({ email, password: E2E_PASSWORD })
      .expect(200);

    const res = await agent
      .post('/finance/settlements')
      .send({ branchId, actualCash: 500, actualCreditCard: 0, actualQR: 0 })
      .expect(201);

    expect(res.body.branchId).toBe(branchId);
    expect(res.body.actualCash).toBe(500);
  });

  it('rejects settlement for another branch', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/auth/login')
      .send({ email, password: E2E_PASSWORD })
      .expect(200);

    await agent
      .post('/finance/settlements')
      .send({ branchId: 99999, actualCash: 100 })
      .expect(403);
  });
});
