import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { toNum } from '../common/decimal.util';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async createExpense(data: { branchId: number; amount: number; category: string; description?: string; recordedById: number }) {
    return this.prisma.expense.create({ data });
  }

  async getExpenses(branchId: number, date?: Date) {
    const where: Prisma.ExpenseWhereInput = { branchId };
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }
    return this.prisma.expense.findMany({ where, orderBy: { createdAt: 'desc' }, include: { recordedBy: { select: { name: true } } } });
  }

  async calculateExpectedCash(branchId: number, date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const cashOrders = await this.prisma.order.aggregate({
      where: { branchId, paymentMethod: 'CASH', createdAt: { gte: start, lte: end } },
      _sum: { netAmount: true }
    });

    const creditCardOrders = await this.prisma.order.aggregate({
      where: { branchId, paymentMethod: 'CREDIT_CARD', createdAt: { gte: start, lte: end } },
      _sum: { netAmount: true }
    });

    const qrOrders = await this.prisma.order.aggregate({
      where: { branchId, paymentMethod: 'QR_PROMPTPAY', createdAt: { gte: start, lte: end } },
      _sum: { netAmount: true }
    });

    const expenses = await this.prisma.expense.aggregate({
      where: { branchId, createdAt: { gte: start, lte: end } },
      _sum: { amount: true }
    });

    const expectedCash = toNum(cashOrders._sum.netAmount) - toNum(expenses._sum.amount);
    return { 
      expectedCash, 
      expectedCreditCard: toNum(creditCardOrders._sum.netAmount),
      expectedQR: toNum(qrOrders._sum.netAmount),
      sales: toNum(cashOrders._sum.netAmount), 
      expenses: toNum(expenses._sum.amount) 
    };
  }

  async submitSettlement(data: { branchId: number; actualCash: number; actualCreditCard?: number; actualQR?: number; submittedById: number }) {
    const today = new Date();
    const existing = await this.prisma.shiftSettlement.findFirst({
      where: { 
        branchId: data.branchId, 
        date: { gte: new Date(today.setHours(0,0,0,0)), lte: new Date(today.setHours(23,59,59,999)) } 
      }
    });

    if (existing && existing.status === 'APPROVED') {
      throw new BadRequestException('Settlement for today is already approved.');
    }

    const calc = await this.calculateExpectedCash(data.branchId, new Date());
    const actualCreditCard = data.actualCreditCard || 0;
    const actualQR = data.actualQR || 0;
    
    // Difference is based on total discrepancy
    const totalExpected = calc.expectedCash + calc.expectedCreditCard + calc.expectedQR;
    const totalActual = data.actualCash + actualCreditCard + actualQR;
    const difference = totalActual - totalExpected;

    if (existing) {
      return this.prisma.shiftSettlement.update({
        where: { id: existing.id },
        data: {
          expectedCash: calc.expectedCash,
          actualCash: data.actualCash,
          expectedCreditCard: calc.expectedCreditCard,
          actualCreditCard,
          expectedQR: calc.expectedQR,
          actualQR,
          difference,
          status: 'PENDING',
          submittedById: data.submittedById
        }
      });
    }

    return this.prisma.shiftSettlement.create({
      data: {
        branchId: data.branchId,
        date: new Date(),
        expectedCash: calc.expectedCash,
        actualCash: data.actualCash,
        expectedCreditCard: calc.expectedCreditCard,
        actualCreditCard,
        expectedQR: calc.expectedQR,
        actualQR,
        difference,
        submittedById: data.submittedById
      }
    });
  }

  async getSettlements(branchId?: number) {
    const where = branchId ? { branchId } : {};
    return this.prisma.shiftSettlement.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { submittedBy: { select: { name: true } }, branch: { select: { name: true } } }
    });
  }

  async approveSettlement(id: number) {
    return this.prisma.shiftSettlement.update({
      where: { id },
      data: { status: 'APPROVED' }
    });
  }

  async exportSales(branchId?: number, startDate?: Date, endDate?: Date): Promise<string> {
    const { Parser } = require('json2csv');
    
    const where: Prisma.OrderWhereInput = {};
    if (branchId) where.branchId = branchId;
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      const end = new Date(endDate);
      end.setHours(23,59,59,999);
      where.createdAt = { gte: start, lte: end };
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: { select: { name: true } },
        user: { select: { name: true } },
        customer: { select: { name: true, phone: true } },
      }
    });

    if (orders.length === 0) {
      return '';
    }

    const flatOrders = orders.map(order => ({
      OrderID: order.id,
      Date: order.createdAt.toISOString(),
      Branch: order.branch.name,
      Cashier: order.user.name,
      Customer: order.customer ? order.customer.name : 'Walk-in',
      Status: order.status,
      TotalAmount: order.totalAmount,
      Discount: order.discountAmount,
      NetAmount: order.netAmount,
      PointsEarned: order.pointsEarned,
      PointsRedeemed: order.pointsRedeemed
    }));

    const json2csvParser = new Parser();
    return json2csvParser.parse(flatOrders);
  }
}
