import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { NavCountsService } from './nav-counts.service';

@Controller('nav-counts')
@UseGuards(JwtAuthGuard)
export class NavCountsController {
  constructor(private readonly navCountsService: NavCountsService) {}

  @Get()
  getNavCounts(
    @Request() req: RequestWithUser,
    @Query('branchId') branchIdQuery?: string,
  ) {
    const branchId =
      branchIdQuery != null && branchIdQuery !== ''
        ? parseInt(branchIdQuery, 10)
        : undefined;
    return this.navCountsService.getNavCounts(req.user, branchId);
  }
}
