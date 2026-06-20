import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales-trends')
  getSalesTrends(@Query('branchId') branchIdQuery?: string) {
    const branchId = branchIdQuery ? parseInt(branchIdQuery) : undefined;
    return this.reportsService.getSalesTrends(branchId);
  }

  @Get('top-products')
  getTopProducts(@Query('branchId') branchIdQuery?: string) {
    const branchId = branchIdQuery ? parseInt(branchIdQuery) : undefined;
    return this.reportsService.getTopProducts(branchId);
  }

  @Get('profit-loss')
  getProfitLoss(@Query('branchId') branchIdQuery?: string) {
    const branchId = branchIdQuery ? parseInt(branchIdQuery) : undefined;
    return this.reportsService.getProfitLoss(branchId);
  }
}
