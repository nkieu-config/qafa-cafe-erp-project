import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceService } from './finance.service';

@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('expenses')
  createExpense(@Body() body: { amount: number; category: string; description?: string }, @Request() req: any) {
    const branchId = req.user.branchId || 1;
    return this.financeService.createExpense({ ...body, branchId, recordedById: req.user.userId });
  }

  @Get('expenses')
  getExpenses(@Request() req: any, @Query('date') date?: string) {
    const branchId = req.user.branchId || 1;
    return this.financeService.getExpenses(branchId, date ? new Date(date) : undefined);
  }

  @Get('settlements/expected')
  getExpectedCash(@Request() req: any) {
    const branchId = req.user.branchId || 1;
    return this.financeService.calculateExpectedCash(branchId, new Date());
  }

  @Post('settlements')
  submitSettlement(@Body() body: { actualCash: number }, @Request() req: any) {
    const branchId = req.user.branchId || 1;
    return this.financeService.submitSettlement({ branchId, actualCash: body.actualCash, submittedById: req.user.userId });
  }

  @Get('settlements')
  getSettlements(@Request() req: any) {
    const branchId = req.user.role === 'SUPER_ADMIN' ? undefined : (req.user.branchId || 1);
    return this.financeService.getSettlements(branchId);
  }

  @Patch('settlements/:id/approve')
  approveSettlement(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.approveSettlement(id);
  }
}
