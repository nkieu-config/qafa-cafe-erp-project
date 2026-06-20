import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('accounts')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async getAccounts() {
    return this.accountingService.getChartOfAccounts();
  }

  @Get('journal-entries')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async getJournalEntries() {
    return this.accountingService.getJournalEntries();
  }

  @Post('seed')
  @Roles('SUPER_ADMIN')
  async seedAccounts() {
    await this.accountingService.seedAccounts();
    return { success: true, message: 'Accounts seeded successfully' };
  }
}
