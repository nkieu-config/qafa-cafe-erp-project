import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe, UseGuards, Request, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceService } from './finance.service';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('expenses')
  createExpense(@Body() body: { branchId?: number; amount: number; category: string; description?: string }, @Request() req: RequestWithUser) {
    const branchId = body.branchId || req.user.branchId || 1;
    return this.financeService.createExpense({ ...body, branchId, recordedById: req.user.userId });
  }

  @Get('expenses')
  getExpenses(@Request() req: RequestWithUser, @Query('date') date?: string, @Query('branchId') branchIdQuery?: string) {
    const branchId = branchIdQuery ? parseInt(branchIdQuery) : (req.user.branchId || 1);
    return this.financeService.getExpenses(branchId, date ? new Date(date) : undefined);
  }

  @Get('settlements/expected')
  getExpectedCash(@Request() req: RequestWithUser, @Query('branchId') branchIdQuery?: string) {
    const branchId = branchIdQuery ? parseInt(branchIdQuery) : (req.user.branchId || 1);
    return this.financeService.calculateExpectedCash(branchId, new Date());
  }

  @Post('settlements')
  submitSettlement(@Body() body: { branchId?: number; actualCash: number; actualCreditCard?: number; actualQR?: number }, @Request() req: RequestWithUser) {
    const branchId = body.branchId || req.user.branchId || 1;
    return this.financeService.submitSettlement({ 
      branchId, 
      actualCash: body.actualCash, 
      actualCreditCard: body.actualCreditCard,
      actualQR: body.actualQR,
      submittedById: req.user.userId 
    });
  }

  @Get('settlements')
  getSettlements(@Request() req: RequestWithUser, @Query('branchId') branchIdQuery?: string) {
    let branchId = branchIdQuery ? parseInt(branchIdQuery) : undefined;
    if (req.user.role !== 'SUPER_ADMIN' && !branchId) {
      branchId = req.user.branchId || 1;
    }
    return this.financeService.getSettlements(branchId);
  }

  @Patch('settlements/:id/approve')
  approveSettlement(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.approveSettlement(id);
  }

  @Get('export/sales')
  async exportSales(
    @Request() req: RequestWithUser,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchIdQuery?: string
  ) {
    let branchId = branchIdQuery ? parseInt(branchIdQuery) : undefined;
    if (req.user.role !== 'SUPER_ADMIN' && !branchId) {
      branchId = req.user.branchId || 1;
    }
    
    const csvData = await this.financeService.exportSales(
      branchId, 
      startDate ? new Date(startDate) : undefined, 
      endDate ? new Date(endDate) : undefined
    );
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-export.csv"');
    res.send(csvData);
  }
}
