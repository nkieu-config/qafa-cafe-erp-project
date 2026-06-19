import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async createExpense(data: { branchId: number; amount: number; category: string; description?: string; recordedById: number }) {
    return this.prisma.expense.create({ data });
  }

  async getExpenses(branchId: number, date?: Date) {
    const where: any = { branchId };
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

    const orders = await this.prisma.order.aggregate({
      where: { branchId, createdAt: { gte: start, lte: end } },
      _sum: { netAmount: true }
    });

    const expenses = await this.prisma.expense.aggregate({
      where: { branchId, createdAt: { gte: start, lte: end } },
      _sum: { amount: true }
    });

    const expectedCash = (orders._sum.netAmount || 0) - (expenses._sum.amount || 0);
    return { expectedCash, sales: orders._sum.netAmount || 0, expenses: expenses._sum.amount || 0 };
  }

  async submitSettlement(data: { branchId: number; actualCash: number; submittedById: number }) {
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
    const difference = data.actualCash - calc.expectedCash;

    if (existing) {
      return this.prisma.shiftSettlement.update({
        where: { id: existing.id },
        data: {
          expectedCash: calc.expectedCash,
          actualCash: data.actualCash,
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
}
