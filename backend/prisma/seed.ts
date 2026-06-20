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
  await prisma.expense.deleteMany();
  await prisma.shiftSettlement.deleteMany();
  await prisma.wasteLog.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.inventoryBatch.deleteMany();
  await prisma.branchInventory.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  console.log('Seeding database with Multi-Branch Data...');

  // 1. Create Branches
  const mainBranch = await prisma.branch.create({
    data: { name: 'Siam Paragon Branch', location: 'Bangkok' },
  });
  
  const secondBranch = await prisma.branch.create({
    data: { name: 'Asok Branch', location: 'Bangkok' },
  });

  // 2. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@qafacafe.com',
      name: 'Super Admin',
      password: 'password123', // Will be hashed in the Auth step
      role: 'SUPER_ADMIN',
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff.siam@qafacafe.com',
      name: 'Siam Cashier',
      password: 'password123',
      role: 'STAFF',
      branchId: mainBranch.id,
    },
  });

  // 3. Create Ingredients (Global Dictionary)
  const coffeeBeans = await prisma.ingredient.create({ data: { name: 'Espresso Beans', unit: 'g', costPerUnit: 0.5 } });
  const milk = await prisma.ingredient.create({ data: { name: 'Whole Milk', unit: 'ml', costPerUnit: 0.05 } });
  const cup = await prisma.ingredient.create({ data: { name: 'Paper Cup', unit: 'pcs', costPerUnit: 3.5 } });
  const syrup = await prisma.ingredient.create({ data: { name: 'Vanilla Syrup', unit: 'ml', costPerUnit: 0.2 } });

  // 4. Create Branch Inventories (Stock per branch)
  await prisma.branchInventory.createMany({
    data: [
      { branchId: mainBranch.id, ingredientId: coffeeBeans.id, stock: 5000, minStock: 1000 },
      { branchId: mainBranch.id, ingredientId: milk.id, stock: 10000, minStock: 2000 },
      { branchId: mainBranch.id, ingredientId: cup.id, stock: 500, minStock: 100 },
      { branchId: mainBranch.id, ingredientId: syrup.id, stock: 1000, minStock: 200 },
      // Second branch has less stock
      { branchId: secondBranch.id, ingredientId: coffeeBeans.id, stock: 2000, minStock: 1000 },
      { branchId: secondBranch.id, ingredientId: milk.id, stock: 3000, minStock: 2000 },
      { branchId: secondBranch.id, ingredientId: cup.id, stock: 150, minStock: 100 },
      { branchId: secondBranch.id, ingredientId: syrup.id, stock: 500, minStock: 200 },
    ],
  });

  // 5. Create Suppliers
  const supplier1 = await prisma.supplier.create({
    data: { name: 'Global Coffee Beans Roaster', contactEmail: 'sales@gcr.com', phone: '0812345678' },
  });

  const supplier2 = await prisma.supplier.create({
    data: { name: 'Thai Dairy Farm', contactEmail: 'order@thaidairy.com', phone: '0898765432' },
  });

  // 6. Create Products and Recipes
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
