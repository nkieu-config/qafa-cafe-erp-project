import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Cleaning existing data...');
  // Clean up
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database...');

  // 1. Create a User (Admin/Staff)
  const user = await prisma.user.create({
    data: {
      email: 'staff@cafesync.com',
      name: 'John Staff',
      password: 'password123', // In a real app, hash this!
      role: 'STAFF',
    },
  });

  // 2. Create Ingredients
  const coffeeBeans = await prisma.ingredient.create({
    data: { name: 'Espresso Beans', unit: 'g', stock: 5000, minStock: 1000 },
  });
  
  const milk = await prisma.ingredient.create({
    data: { name: 'Whole Milk', unit: 'ml', stock: 10000, minStock: 2000 },
  });

  const cup = await prisma.ingredient.create({
    data: { name: 'Paper Cup', unit: 'pcs', stock: 500, minStock: 100 },
  });

  const syrup = await prisma.ingredient.create({
    data: { name: 'Vanilla Syrup', unit: 'ml', stock: 1000, minStock: 200 },
  });

  // 3. Create Products and Recipes
  await prisma.product.create({
    data: {
      name: 'Espresso',
      price: 60,
      category: 'Coffee',
      recipeItems: {
        create: [
          { ingredientId: coffeeBeans.id, quantity: 18 },
          { ingredientId: cup.id, quantity: 1 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Iced Latte',
      price: 85,
      category: 'Coffee',
      recipeItems: {
        create: [
          { ingredientId: coffeeBeans.id, quantity: 18 },
          { ingredientId: milk.id, quantity: 150 },
          { ingredientId: cup.id, quantity: 1 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Vanilla Latte',
      price: 95,
      category: 'Coffee',
      recipeItems: {
        create: [
          { ingredientId: coffeeBeans.id, quantity: 18 },
          { ingredientId: milk.id, quantity: 150 },
          { ingredientId: syrup.id, quantity: 15 },
          { ingredientId: cup.id, quantity: 1 },
        ],
      },
    },
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
