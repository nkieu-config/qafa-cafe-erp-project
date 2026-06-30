import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { NavCountsService } from './nav-counts.service';
import { parseOptionalPositiveInt } from '../common/query-params.util';

@Controller('nav-counts')
@UseGuards(JwtAuthGuard)
export class NavCountsController {
  constructor(private readonly navCountsService: NavCountsService) {}

  @Get()
  getNavCounts(
    @Request() req: RequestWithUser,
    @Query('branchId') branchIdQuery?: string,
  ) {
    const branchId = parseOptionalPositiveInt(branchIdQuery, 'branchId');
    return this.navCountsService.getNavCounts(req.user, branchId);
  }
}
