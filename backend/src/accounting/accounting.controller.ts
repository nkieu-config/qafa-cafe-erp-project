import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { resolveOptionalBranchId } from '../auth/branch-scope.util';

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
  async getJournalEntries(
    @Request() req: RequestWithUser,
    @Query('branchId') branchId?: string,
  ) {
    const resolvedBranchId = resolveOptionalBranchId(
      req.user,
      branchId ? parseInt(branchId, 10) : undefined,
    );
    return this.accountingService.getJournalEntries(resolvedBranchId);
  }

  @Get('profit-loss')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async getProfitLoss(
    @Request() req: RequestWithUser,
    @Query('branchId') branchId?: string,
  ) {
    const resolvedBranchId = resolveOptionalBranchId(
      req.user,
      branchId ? parseInt(branchId, 10) : undefined,
    );
    return this.accountingService.getProfitLoss(resolvedBranchId);
  }

  @Post('seed')
  @Roles('SUPER_ADMIN')
  async seedAccounts() {
    await this.accountingService.seedAccounts();
    return { success: true, message: 'Accounts seeded successfully' };
  }
}
