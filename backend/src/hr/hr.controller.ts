import { Controller, Get, Post, Body, Param, ParseIntPipe, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { LeaveType, LeaveStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Post('clock-in')
  clockIn(@Request() req: RequestWithUser, @Body('branchId', ParseIntPipe) branchId: number) {
    return this.hrService.clockIn(req.user.userId, branchId);
  }

  @Post('clock-out')
  clockOut(@Request() req: RequestWithUser) {
    return this.hrService.clockOut(req.user.userId);
  }

  @Get('attendance/me')
  getMyAttendance(@Request() req: RequestWithUser) {
    return this.hrService.getMyAttendance(req.user.userId);
  }

  @Get('attendance/status')
  getActiveClockIn(@Request() req: RequestWithUser) {
    return this.hrService.getActiveClockIn(req.user.userId);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Post('shifts')
  createShift(@Body() data: { userId: number; branchId: number; startTime: string; endTime: string }) {
    return this.hrService.createShift(data);
  }

  @Get('shifts/branch/:branchId')
  getShiftsByBranch(@Param('branchId', ParseIntPipe) branchId: number) {
    return this.hrService.getShiftsByBranch(branchId);
  }

  @Get('shifts/me')
  getMyShifts(@Request() req: RequestWithUser) {
    return this.hrService.getMyShifts(req.user.userId);
  }

  // ==================== LEAVE ====================
  @Post('leave')
  requestLeave(@Request() req: RequestWithUser, @Body() data: { type: LeaveType, startDate: string, endDate: string, reason?: string }) {
    return this.hrService.requestLeave(req.user.userId, data);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Get('leave')
  getLeaveRequests(@Query('branchId') branchId?: string) {
    return this.hrService.getLeaveRequests(branchId ? parseInt(branchId) : undefined);
  }

  @Get('leave/me')
  getMyLeaveRequests(@Request() req: RequestWithUser) {
    return this.hrService.getMyLeaveRequests(req.user.userId);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Patch('leave/:id/status')
  processLeaveRequest(@Param('id', ParseIntPipe) id: number, @Body('status') status: LeaveStatus) {
    return this.hrService.processLeaveRequest(id, status);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Post('payroll/generate')
  generatePayrollRun(
    @Body('branchId', ParseIntPipe) branchId: number, 
    @Body('month', ParseIntPipe) month: number, 
    @Body('year', ParseIntPipe) year: number
  ) {
    return this.hrService.generatePayrollRun(branchId, month, year);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Get('payroll-runs')
  getPayrollRuns(@Query('branchId', ParseIntPipe) branchId: number) {
    return this.hrService.getPayrollRuns(branchId);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Patch('payroll-runs/:id/approve')
  approvePayrollRun(@Param('id', ParseIntPipe) id: number) {
    return this.hrService.approvePayrollRun(id);
  }

  @Roles('SUPER_ADMIN')
  @Patch('users/:userId/rate')
  updateHourlyRate(@Param('userId', ParseIntPipe) userId: number, @Body('hourlyRate') hourlyRate: number) {
    return this.hrService.updateHourlyRate(userId, Number(hourlyRate));
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Get('users')
  getAllUsers(@Request() req: RequestWithUser, @Query('branchId') branchId?: string) {
    const resolvedBranchId = req.user.role === 'SUPER_ADMIN' && branchId
      ? parseInt(branchId, 10)
      : req.user.branchId ?? undefined;
    return this.hrService.getAllUsers(resolvedBranchId);
  }

  @Roles('SUPER_ADMIN')
  @Post('users')
  createUser(@Body() data: any) {
    return this.hrService.createUser(data);
  }

  @Roles('SUPER_ADMIN')
  @Patch('users/:id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.hrService.updateUser(id, data);
  }
}
