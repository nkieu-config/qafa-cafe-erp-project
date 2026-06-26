import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { resolveOptionalBranchId } from '../auth/branch-scope.util';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales-trends')
  getSalesTrends(
    @Request() req: RequestWithUser,
    @Query('branchId') branchIdQuery?: string,
  ) {
    const branchId = resolveOptionalBranchId(
      req.user,
      branchIdQuery ? parseInt(branchIdQuery, 10) : undefined,
    );
    return this.reportsService.getSalesTrends(branchId);
  }

  @Get('top-products')
  getTopProducts(
    @Request() req: RequestWithUser,
    @Query('branchId') branchIdQuery?: string,
  ) {
    const branchId = resolveOptionalBranchId(
      req.user,
      branchIdQuery ? parseInt(branchIdQuery, 10) : undefined,
    );
    return this.reportsService.getTopProducts(branchId);
  }

  @Get('profit-loss')
  getProfitLoss(
    @Request() req: RequestWithUser,
    @Query('branchId') branchIdQuery?: string,
  ) {
    const branchId = resolveOptionalBranchId(
      req.user,
      branchIdQuery ? parseInt(branchIdQuery, 10) : undefined,
    );
    return this.reportsService.getProfitLoss(branchId);
  }

  @Get('executive-summary')
  getExecutiveSummary(
    @Request() req: RequestWithUser,
    @Query('branchId') branchIdQuery?: string,
  ) {
    const branchId = resolveOptionalBranchId(
      req.user,
      branchIdQuery ? parseInt(branchIdQuery, 10) : undefined,
    );
    return this.reportsService.getExecutiveSummary(branchId);
  }
}
