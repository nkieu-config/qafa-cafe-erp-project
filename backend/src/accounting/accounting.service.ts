import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../orders/events/order-created.event';
import { toNum } from '../common/decimal.util';

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(private prisma: PrismaService) {}

  @OnEvent('order.created', { async: true })
  async handleOrderCreated(event: OrderCreatedEvent) {
    this.logger.log(`Handling order.created event for Accounting (Order ${event.order.id})`);
    
    const { order } = event;
    const netAmount = toNum(order.netAmount);
    const totalCogs = toNum(order.totalCogs);

    // Post Accounting Journal Entry
    if (netAmount > 0 || totalCogs > 0) {
      try {
        await this.createJournalEntry({
          branchId: order.branchId,
          reference: `ORD-${order.id}`,
          description: `Sales Revenue and COGS for Order ${order.id}`,
          lines: [
            { accountCode: '1010', debit: netAmount, credit: 0, description: 'Cash received' },
            { accountCode: '4010', debit: 0, credit: netAmount, description: 'Sales Revenue' },
            ...(totalCogs > 0 ? [
              { accountCode: '5010', debit: totalCogs, credit: 0, description: 'Cost of Goods Sold' },
              { accountCode: '1030', debit: 0, credit: totalCogs, description: 'Inventory reduction' }
            ] : [])
          ]
        });
      } catch (err) {
        this.logger.error(`[Accounting] Failed to post auto-journal entry for order ${order.id}:`, err);
      }
    }
  }

  async getChartOfAccounts() {
    return this.prisma.account.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async getJournalEntries(branchId?: number, limit = 50) {
    return this.prisma.journalEntry.findMany({
      where: branchId ? { branchId } : {},
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });
  }

  async createJournalEntry(data: {
    branchId?: number;
    date?: Date;
    reference?: string;
    description: string;
    lines: { accountCode: string; debit: number; credit: number; description?: string }[];
  }) {
    // 1. Verify debits equal credits
    const totalDebits = data.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = data.lines.reduce((sum, line) => sum + line.credit, 0);

    // Use a small epsilon to handle floating point issues
    if (Math.abs(totalDebits - totalCredits) > 0.001) {
      throw new BadRequestException(`Journal entry unbalanced. Debits: ${totalDebits}, Credits: ${totalCredits}`);
    }

    // 2. Fetch account IDs based on codes
    const accountCodes = data.lines.map(l => l.accountCode);
    const accounts = await this.prisma.account.findMany({
      where: { code: { in: accountCodes } },
    });

    if (accounts.length !== new Set(accountCodes).size) {
      throw new BadRequestException('One or more account codes are invalid.');
    }

    const accountMap = new Map(accounts.map(a => [a.code, a.id]));

    // 3. Create the journal entry
    return this.prisma.journalEntry.create({
      data: {
        branchId: data.branchId,
        date: data.date || new Date(),
        reference: data.reference,
        description: data.description,
        status: 'POSTED',
        lines: {
          create: data.lines.map(line => ({
            accountId: accountMap.get(line.accountCode)!,
            debit: line.debit,
            credit: line.credit,
            description: line.description,
          })),
        },
      },
      include: {
        lines: true,
      },
    });
  }

  // Helper method to seed initial accounts if they don't exist
  async seedAccounts() {
    const defaultAccounts = [
      { code: '1010', name: 'Cash', type: 'ASSET' as const },
      { code: '1020', name: 'Accounts Receivable', type: 'ASSET' as const },
      { code: '1030', name: 'Inventory', type: 'ASSET' as const },
      { code: '2010', name: 'Accounts Payable', type: 'LIABILITY' as const },
      { code: '3010', name: 'Owner Equity', type: 'EQUITY' as const },
      { code: '4010', name: 'Sales Revenue', type: 'REVENUE' as const },
      { code: '5010', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE' as const },
      { code: '5020', name: 'Payroll Expense', type: 'EXPENSE' as const },
    ];

    for (const acc of defaultAccounts) {
      await this.prisma.account.upsert({
        where: { code: acc.code },
        update: {},
        create: acc,
      });
    }
    
    this.logger.log('Default accounts seeded.');
  }

  async getProfitLoss(branchId?: number) {
    const branchFilter = branchId ? Prisma.sql`AND je."branchId" = ${branchId}` : Prisma.empty;
    
    // Use raw SQL to group by month and account type directly in the database
    // This prevents loading thousands of rows into Node.js memory
    const results = await this.prisma.$queryRaw<
      { month: string; type: string; total_credit: number; total_debit: number }[]
    >`
      SELECT 
        to_char(je."date", 'YYYY-MM') as month,
        a."type" as type,
        SUM(jel.credit) as total_credit,
        SUM(jel.debit) as total_debit
      FROM "JournalEntryLine" jel
      INNER JOIN "JournalEntry" je ON jel."journalEntryId" = je.id
      INNER JOIN "Account" a ON jel."accountId" = a.id
      WHERE a."type" IN ('REVENUE', 'EXPENSE')
      ${branchFilter}
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `;

    const monthlyData = new Map<string, { revenue: number; expense: number }>();

    // Initialize map with last 6 months to ensure we have data points
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = d.toISOString().slice(0, 7);
      monthlyData.set(mStr, { revenue: 0, expense: 0 });
    }

    for (const row of results) {
      if (!monthlyData.has(row.month)) {
        monthlyData.set(row.month, { revenue: 0, expense: 0 });
      }
      
      const stats = monthlyData.get(row.month)!;
      if (row.type === 'REVENUE') {
        stats.revenue += (Number(row.total_credit) - Number(row.total_debit));
      } else if (row.type === 'EXPENSE') {
        stats.expense += (Number(row.total_debit) - Number(row.total_credit));
      }
    }

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}
