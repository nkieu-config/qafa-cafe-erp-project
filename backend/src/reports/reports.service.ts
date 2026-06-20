import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesTrends(branchId?: number) {
    // Return last 7 days of sales aggregated by day
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { in: ['COMPLETED', 'PENDING', 'PREPARING'] }, // Count all valid orders
        ...(branchId && { branchId }),
      },
      select: {
        netAmount: true,
        createdAt: true,
      }
    });

    const dailyMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyMap.set(dateStr, 0);
    }

    for (const order of orders) {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, dailyMap.get(dateStr)! + order.netAmount);
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

    const revenue = orders._sum.netAmount || 0;
    const cogs = orders._sum.totalCogs || 0;
    const expenseTotal = expenses._sum.amount || 0;
    const payrollTotal = payrolls._sum.netPay || 0;

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
}
