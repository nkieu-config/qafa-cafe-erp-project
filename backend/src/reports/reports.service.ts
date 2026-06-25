import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { toNum } from '../common/decimal.util';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesTrends(branchId?: number) {
    // Return last 7 days of sales aggregated by day
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const branchFilter = branchId ? Prisma.sql`AND "branchId" = ${branchId}` : Prisma.empty;

    const results = await this.prisma.$queryRaw<{ date: string; total: number }[]>`
      SELECT 
        to_char("createdAt", 'YYYY-MM-DD') as date,
        SUM("netAmount") as total
      FROM "Order"
      WHERE "createdAt" >= ${sevenDaysAgo}
      AND "status" IN ('COMPLETED', 'PENDING', 'PREPARING')
      ${branchFilter}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const dailyMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyMap.set(dateStr, 0);
    }

    for (const row of results) {
      if (dailyMap.has(row.date)) {
        dailyMap.set(row.date, Number(row.total));
      }
    }

    return Array.from(dailyMap.entries()).map(([date, total]) => ({ date, total }));
  }

  async getTopProducts(branchId?: number) {
    // We aggregate OrderItems across orders
    const where = branchId ? { order: { branchId } } : {};
    
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        price: true, // This is total price if we sum (quantity * unit price) but Prisma _sum.price sums the price column
      },
      where,
      orderBy: {
        _sum: { quantity: 'desc' }
      },
      take: 5,
    });

    // Populate product names
    const result: any[] = [];
    for (const item of items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        result.push({
          productId: item.productId,
          name: product.name,
          totalQuantity: item._sum.quantity || 0,
        });
      }
    }
    
    return result;
  }

  async getProfitLoss(branchId?: number) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const whereBranch = branchId ? { branchId } : {};

    const orders = await this.prisma.order.aggregate({
      where: { ...whereBranch, createdAt: { gte: startOfMonth } },
      _sum: { netAmount: true, totalCogs: true },
    });

    const expenses = await this.prisma.expense.aggregate({
      where: { ...whereBranch, createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    });

    const payrolls = await this.prisma.payslip.aggregate({
      where: { 
        payrollRun: { ...(branchId && { branchId }), createdAt: { gte: startOfMonth } }
      },
      _sum: { netPay: true },
    });

    const revenue = toNum(orders._sum.netAmount);
    const cogs = toNum(orders._sum.totalCogs);
    const expenseTotal = toNum(expenses._sum.amount);
    const payrollTotal = toNum(payrolls._sum.netPay);

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenseTotal - payrollTotal;

    return {
      revenue,
      cogs,
      grossProfit,
      expenses: expenseTotal,
      payroll: payrollTotal,
      netProfit,
    };
  }

  async getExecutiveSummary(branchId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const whereBranch = branchId ? { branchId } : {};

    // 1. Sales Today vs Yesterday
    const salesTodayAgg = await this.prisma.order.aggregate({
      where: { ...whereBranch, createdAt: { gte: today }, status: { in: ['COMPLETED', 'PENDING', 'PREPARING'] } },
      _sum: { netAmount: true },
    });
    const salesYesterdayAgg = await this.prisma.order.aggregate({
      where: { ...whereBranch, createdAt: { gte: yesterday, lt: today }, status: { in: ['COMPLETED', 'PENDING', 'PREPARING'] } },
      _sum: { netAmount: true },
    });

    const salesToday = toNum(salesTodayAgg._sum.netAmount);
    const salesYesterday = toNum(salesYesterdayAgg._sum.netAmount);
    let salesGrowth = 0;
    if (salesYesterday > 0) {
      salesGrowth = ((salesToday - salesYesterday) / salesYesterday) * 100;
    }

    // 2. Top Branch by Sales Today
    let topBranch: any = null;
    if (!branchId) {
      const branchSales = await this.prisma.order.groupBy({
        by: ['branchId'],
        _sum: { netAmount: true },
        where: { createdAt: { gte: today }, status: { in: ['COMPLETED', 'PENDING', 'PREPARING'] } },
        orderBy: { _sum: { netAmount: 'desc' } },
        take: 1,
      });

      if (branchSales.length > 0) {
        const branch = await this.prisma.branch.findUnique({ where: { id: branchSales[0].branchId } });
        if (branch) {
          topBranch = {
            id: branch.id,
            name: branch.name,
            totalSales: branchSales[0]._sum.netAmount || 0,
          };
        }
      }
    }

    // 3. Low Stock Alerts
    const inventories = await this.prisma.branchInventory.findMany({
      where: whereBranch,
      include: { ingredient: true, branch: true },
    });

    const alerts = inventories
      .filter(inv => inv.stock <= inv.minStock)
      .sort((a, b) => (a.stock - a.minStock) - (b.stock - b.minStock))
      .slice(0, 5)
      .map(inv => ({
        id: inv.id,
        ingredientName: inv.ingredient.name,
        branchName: inv.branch.name,
        stock: inv.stock,
        minStock: inv.minStock,
      }));

    return {
      salesToday,
      salesYesterday,
      salesGrowth,
      topBranch,
      lowStockAlerts: alerts,
    };
  }
}
