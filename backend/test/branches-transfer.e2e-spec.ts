import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp } from './e2e-app.util';
import { E2E_PASSWORD } from './e2e-fixtures.util';

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('Branch transfer flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const email = 'transfer-admin@e2e.test';
  let fromBranchId: number;
  let toBranchId: number;
  let ingredientId: number;

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);

    const fromBranch = await prisma.branch.create({
      data: { name: 'E2E Transfer From', location: 'A' },
    });
    const toBranch = await prisma.branch.create({
      data: { name: 'E2E Transfer To', location: 'B' },
    });
    fromBranchId = fromBranch.id;
    toBranchId = toBranch.id;

    const ingredient = await prisma.ingredient.create({
      data: { name: 'E2E Transfer Beans', unit: 'g', costPerUnit: 1 },
    });
    ingredientId = ingredient.id;

    await prisma.branchInventory.create({
      data: { branchId: fromBranchId, ingredientId, stock: 100, minStock: 10 },
    });

    await prisma.inventoryBatch.create({
      data: {
        branchId: fromBranchId,
        ingredientId,
        quantity: 100,
        status: 'ACTIVE',
      },
    });

    await prisma.user.create({
      data: {
        email,
        name: 'Transfer Admin',
        password: await bcrypt.hash(E2E_PASSWORD, 10),
        role: 'SUPER_ADMIN',
      },
    });
  });

  afterAll(async () => {
    await prisma.stockTransfer.deleteMany({
      where: { fromBranch: { name: 'E2E Transfer From' } },
    });
    await prisma.inventoryBatch.deleteMany({
      where: { ingredient: { name: 'E2E Transfer Beans' } },
    });
    await prisma.branchInventory.deleteMany({
      where: { branch: { name: { in: ['E2E Transfer From', 'E2E Transfer To'] } } },
    });
    await prisma.ingredient.deleteMany({ where: { name: 'E2E Transfer Beans' } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.branch.deleteMany({
      where: { name: { in: ['E2E Transfer From', 'E2E Transfer To'] } },
    });
    await app?.close();
  });

  it('creates and accepts a transfer between branches', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/auth/login')
      .send({ email, password: E2E_PASSWORD })
      .expect(200);

    const transferRes = await agent
      .post('/branches/transfers')
      .send({
        fromBranchId,
        toBranchId,
        ingredientId,
        quantity: 20,
      })
      .expect(201);

    await agent
      .post(`/branches/transfers/${transferRes.body.id}/accept`)
      .expect(201);

    const fromInv = await prisma.branchInventory.findUnique({
      where: { branchId_ingredientId: { branchId: fromBranchId, ingredientId } },
    });
    const toInv = await prisma.branchInventory.findUnique({
      where: { branchId_ingredientId: { branchId: toBranchId, ingredientId } },
    });

    expect(fromInv?.stock).toBe(80);
    expect(toInv?.stock).toBe(20);
  });
});
