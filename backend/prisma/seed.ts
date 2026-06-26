import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Cleaning existing data...');
  await prisma.orderItemModifier.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.shiftSettlement.deleteMany();
  await prisma.wasteLog.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.inventoryBatch.deleteMany();
  await prisma.branchInventory.deleteMany();
  await prisma.journalEntryLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.account.deleteMany();
  await prisma.outboxEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.modifierOption.deleteMany();
  await prisma.modifierGroup.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  console.log('Seeding database with demo cafe data...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const mainBranch = await prisma.branch.create({
    data: { name: 'Siam Paragon Branch', location: 'Bangkok' },
  });
  const secondBranch = await prisma.branch.create({
    data: { name: 'Asok Branch', location: 'Bangkok' },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@qafacafe.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  await prisma.user.create({
    data: {
      email: 'manager@qafacafe.com',
      name: 'Siam Manager',
      password: hashedPassword,
      role: 'MANAGER',
      branchId: mainBranch.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'staff.siam@qafacafe.com',
      name: 'Siam Cashier',
      password: hashedPassword,
      role: 'STAFF',
      branchId: mainBranch.id,
    },
  });

  const supplier1 = await prisma.supplier.create({
    data: { name: 'Global Coffee Beans Roaster', contactEmail: 'sales@gcr.com', phone: '0812345678' },
  });
  const supplier2 = await prisma.supplier.create({
    data: { name: 'Thai Dairy Farm', contactEmail: 'order@thaidairy.com', phone: '0898765432' },
  });

  const coffeeBeans = await prisma.ingredient.create({
    data: { name: 'Espresso Beans', unit: 'g', costPerUnit: 0.5, primarySupplierId: supplier1.id },
  });
  const milk = await prisma.ingredient.create({
    data: { name: 'Whole Milk', unit: 'ml', costPerUnit: 0.05, primarySupplierId: supplier2.id },
  });
  const cup = await prisma.ingredient.create({
    data: { name: 'Paper Cup', unit: 'pcs', costPerUnit: 3.5, primarySupplierId: supplier1.id },
  });
  const syrup = await prisma.ingredient.create({
    data: { name: 'Vanilla Syrup', unit: 'ml', costPerUnit: 0.2, primarySupplierId: supplier1.id },
  });
  const oatMilk = await prisma.ingredient.create({
    data: { name: 'Oat Milk', unit: 'ml', costPerUnit: 0.08, primarySupplierId: supplier2.id },
  });

  const inventoryRows = [
    { branchId: mainBranch.id, ingredientId: coffeeBeans.id, stock: 5000, minStock: 1000 },
    { branchId: mainBranch.id, ingredientId: milk.id, stock: 10000, minStock: 2000 },
    { branchId: mainBranch.id, ingredientId: cup.id, stock: 500, minStock: 100 },
    { branchId: mainBranch.id, ingredientId: syrup.id, stock: 1000, minStock: 200 },
    { branchId: mainBranch.id, ingredientId: oatMilk.id, stock: 3000, minStock: 500 },
    { branchId: secondBranch.id, ingredientId: coffeeBeans.id, stock: 2000, minStock: 1000 },
    { branchId: secondBranch.id, ingredientId: milk.id, stock: 3000, minStock: 2000 },
    { branchId: secondBranch.id, ingredientId: cup.id, stock: 150, minStock: 100 },
    { branchId: secondBranch.id, ingredientId: syrup.id, stock: 500, minStock: 200 },
    { branchId: secondBranch.id, ingredientId: oatMilk.id, stock: 800, minStock: 500 },
  ];
  await prisma.branchInventory.createMany({ data: inventoryRows });
  await prisma.inventoryBatch.createMany({
    data: inventoryRows.map((row) => ({
      branchId: row.branchId,
      ingredientId: row.ingredientId,
      quantity: row.stock,
      status: 'ACTIVE' as const,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })),
  });

  const tempGroup = await prisma.modifierGroup.create({
    data: {
      name: 'Temperature',
      category: 'Coffee',
      sortOrder: 1,
      options: {
        create: [
          { name: 'Hot', priceDelta: 0, isDefault: false, sortOrder: 1 },
          { name: 'Iced', priceDelta: 0, isDefault: true, sortOrder: 2 },
          { name: 'Frappe', priceDelta: 10, isDefault: false, sortOrder: 3 },
        ],
      },
    },
    include: { options: true },
  });

  await prisma.modifierGroup.create({
    data: {
      name: 'Sweetness',
      category: 'Coffee',
      sortOrder: 2,
      options: {
        create: [
          { name: '0%', priceDelta: 0, sortOrder: 1 },
          { name: '50%', priceDelta: 0, sortOrder: 2 },
          { name: '100%', priceDelta: 0, isDefault: true, sortOrder: 3 },
          { name: '150%', priceDelta: 5, sortOrder: 4 },
        ],
      },
    },
  });

  await prisma.modifierGroup.create({
    data: {
      name: 'Milk Type',
      category: 'Coffee',
      sortOrder: 3,
      options: {
        create: [
          { name: 'Normal', priceDelta: 0, isDefault: true, sortOrder: 1 },
          { name: 'Oat', priceDelta: 15, sortOrder: 2 },
          { name: 'Almond', priceDelta: 15, sortOrder: 3 },
        ],
      },
    },
  });

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

  const icedLatte = await prisma.product.create({
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
      name: 'Croissant',
      price: 45,
      category: 'Bakery',
      recipeItems: { create: [] },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Cappuccino',
      price: 52,
      category: 'Coffee',
      recipeItems: {
        create: [
          { ingredientId: coffeeBeans.id, quantity: 18 },
          { ingredientId: milk.id, quantity: 120 },
          { ingredientId: cup.id, quantity: 1 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Vanilla Latte',
      price: 65,
      category: 'Coffee',
      recipeItems: {
        create: [
          { ingredientId: coffeeBeans.id, quantity: 18 },
          { ingredientId: milk.id, quantity: 150 },
          { ingredientId: cup.id, quantity: 1 },
          { ingredientId: syrup.id, quantity: 50 },
        ],
      },
    },
  });

  const customer = await prisma.customer.create({
    data: { phone: '0811111111', name: 'Demo Member', points: 120, tier: 'SILVER' },
  });

  await prisma.promotion.create({
    data: {
      code: 'WELCOME10',
      description: '10% off for demo',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minPurchase: 100,
      isActive: true,
    },
  });

  await prisma.systemSetting.createMany({
    data: [
      { key: 'company_name', value: 'QafaCafe Demo' },
      { key: 'vat_rate', value: '7' },
      { key: 'currency', value: 'THB' },
      { key: 'receipt_footer', value: 'Thank you for visiting QafaCafe!' },
    ],
  });

  const defaultAccounts = [
    { code: '1000', name: 'Cash', type: 'ASSET' as const },
    { code: '1010', name: 'Card Clearing', type: 'ASSET' as const },
    { code: '1020', name: 'QR Clearing', type: 'ASSET' as const },
    { code: '1100', name: 'Inventory', type: 'ASSET' as const },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' as const },
    { code: '4000', name: 'Sales Revenue', type: 'REVENUE' as const },
    { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE' as const },
  ];
  for (const acct of defaultAccounts) {
    await prisma.account.create({ data: acct });
  }

  // Sample orders for dashboard sales trends (last 7 days)
  const icedOption = tempGroup.options.find((o) => o.name === 'Iced')!;
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(12, 0, 0, 0);
    const qty = 5 + (6 - daysAgo);
    const unitPrice = 85;
    const net = unitPrice * qty;

    await prisma.order.create({
      data: {
        userId: admin.id,
        branchId: mainBranch.id,
        customerId: daysAgo % 2 === 0 ? customer.id : undefined,
        status: 'COMPLETED',
        paymentMethod: daysAgo % 3 === 0 ? 'CREDIT_CARD' : 'CASH',
        totalAmount: net,
        netAmount: net,
        discountAmount: 0,
        taxAmount: net * 0.07 / 1.07,
        totalCogs: 18 * 0.5 * qty + 150 * 0.05 * qty + 3.5 * qty,
        pointsEarned: Math.floor(net / 100),
        createdAt,
        items: {
          create: [
            {
              productId: icedLatte.id,
              quantity: qty,
              price: unitPrice,
              notes: 'Temperature: Iced, Sweetness: 100%, Milk Type: Normal',
              modifiers: {
                create: [
                  {
                    optionId: icedOption.id,
                    optionName: 'Temperature: Iced',
                    priceDelta: 0,
                  },
                ],
              },
            },
          ],
        },
      },
    });
  }

  // One pending PO for demo receive flow
  await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-DEMO-001',
      branchId: mainBranch.id,
      supplierId: supplier1.id,
      status: 'APPROVED',
      items: {
        create: [{ ingredientId: coffeeBeans.id, quantityRequested: 1000, unitPrice: 0.45 }],
      },
    },
  });

  console.log('Seeding completed!');
  console.log('Demo logins: admin@qafacafe.com / manager@qafacafe.com / staff.siam@qafacafe.com');
  console.log('Password: password123');
  console.log('Promo code: WELCOME10 | Member phone: 0811111111');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
