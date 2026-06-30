import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FinanceService } from './finance.service';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import {
  resolveBranchId,
  resolveOptionalBranchId,
} from '../auth/branch-scope.util';
import { parseOptionalPositiveInt } from '../common/query-params.util';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { SubmitSettlementDto } from './dto/submit-settlement.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Post('expenses')
  createExpense(
    @Body() dto: CreateExpenseDto,
    @Request() req: RequestWithUser,
  ) {
    const branchId = resolveBranchId(req.user, dto.branchId);
    return this.financeService.createExpense({
      ...dto,
      branchId,
      recordedById: req.user.userId,
    });
  }

  @Get('expenses')
  getExpenses(
    @Request() req: RequestWithUser,
    @Query('date') date?: string,
    @Query('branchId') branchIdQuery?: string,
  ) {
    const branchId = resolveBranchId(
      req.user,
      parseOptionalPositiveInt(branchIdQuery, 'branchId'),
    );
    return this.financeService.getExpenses(
      branchId,
      date ? new Date(date) : undefined,
    );
  }

  @Get('settlements/expected')
  getExpectedCash(
    @Request() req: RequestWithUser,
    @Query('branchId') branchIdQuery?: string,
  ) {
    const branchId = resolveBranchId(
      req.user,
      parseOptionalPositiveInt(branchIdQuery, 'branchId'),
    );
    return this.financeService.calculateExpectedCash(branchId, new Date());
  }

  @Roles('SUPER_ADMIN', 'MANAGER', 'STAFF')
  @Post('settlements')
  submitSettlement(
    @Body() dto: SubmitSettlementDto,
    @Request() req: RequestWithUser,
  ) {
    const branchId = resolveBranchId(req.user, dto.branchId);
    return this.financeService.submitSettlement({
      branchId,
      actualCash: dto.actualCash,
      actualCreditCard: dto.actualCreditCard,
      actualQR: dto.actualQR,
      submittedById: req.user.userId,
    });
  }

  @Get('settlements')
  getSettlements(
    @Request() req: RequestWithUser,
    @Query('branchId') branchIdQuery?: string,
  ) {
    const branchId = resolveOptionalBranchId(
      req.user,
      parseOptionalPositiveInt(branchIdQuery, 'branchId'),
    );
    return this.financeService.getSettlements(branchId);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Patch('settlements/:id/approve')
  approveSettlement(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.financeService.approveSettlement(id, req.user);
  }

  @Get('export/sales')
  async exportSales(
    @Request() req: RequestWithUser,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchIdQuery?: string,
  ) {
    const branchId = resolveOptionalBranchId(
      req.user,
      parseOptionalPositiveInt(branchIdQuery, 'branchId'),
    );

    const csvData = await this.financeService.exportSales(
      branchId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="sales-export.csv"',
    );
    res.send(csvData);
  }
}
