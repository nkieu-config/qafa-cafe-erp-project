import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/prisma/prisma.service';

export const E2E_PASSWORD = 'password123';

export async function seedPosFixture(prisma: PrismaService) {
  const branch = await prisma.branch.create({
    data: { name: 'E2E POS Branch', location: 'Bangkok' },
  });

  const email = 'pos-staff@e2e.test';
  const user = await prisma.user.create({
    data: {
      email,
      name: 'POS Staff',
      password: await bcrypt.hash(E2E_PASSWORD, 10),
      role: 'STAFF',
      branchId: branch.id,
    },
  });

  const ingredient = await prisma.ingredient.create({
    data: { name: 'E2E Beans', unit: 'g', costPerUnit: 1 },
  });

  await prisma.branchInventory.create({
    data: {
      branchId: branch.id,
      ingredientId: ingredient.id,
      stock: 1000,
      minStock: 100,
    },
  });

  const product = await prisma.product.create({
    data: {
      name: 'E2E Latte',
      price: 100,
      category: 'Coffee',
      recipeItems: {
        create: [{ ingredientId: ingredient.id, quantity: 20 }],
      },
    },
  });

  return { branch, user, product, ingredient, email };
}

export async function cleanupPosFixture(prisma: PrismaService, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  await prisma.orderItem.deleteMany({ where: { order: { userId: user.id } } });
  await prisma.order.deleteMany({ where: { userId: user.id } });
  await prisma.recipeItem.deleteMany({ where: { product: { name: 'E2E Latte' } } });
  await prisma.product.deleteMany({ where: { name: 'E2E Latte' } });
  await prisma.branchInventory.deleteMany({ where: { branch: { name: 'E2E POS Branch' } } });
  await prisma.ingredient.deleteMany({ where: { name: 'E2E Beans' } });
  await prisma.user.deleteMany({ where: { email } });
  await prisma.branch.deleteMany({ where: { name: 'E2E POS Branch' } });
}
