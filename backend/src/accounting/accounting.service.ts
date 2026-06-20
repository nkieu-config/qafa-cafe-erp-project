import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(private prisma: PrismaService) {}

  async getChartOfAccounts() {
    return this.prisma.account.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async getJournalEntries(limit = 50) {
    return this.prisma.journalEntry.findMany({
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
}
