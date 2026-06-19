import { Controller, Get, Post, Body, Param, ParseIntPipe, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Post('clock-in')
  clockIn(@Request() req: any, @Body('branchId', ParseIntPipe) branchId: number) {
    return this.hrService.clockIn(req.user.userId, branchId);
  }

  @Post('clock-out')
  clockOut(@Request() req: any) {
    return this.hrService.clockOut(req.user.userId);
  }

  @Get('attendance/me')
  getMyAttendance(@Request() req: any) {
    return this.hrService.getMyAttendance(req.user.userId);
  }

  @Get('attendance/status')
  getActiveClockIn(@Request() req: any) {
    return this.hrService.getActiveClockIn(req.user.userId);
  }

  @Post('shifts')
  createShift(@Body() data: { userId: number; branchId: number; startTime: string; endTime: string }) {
    return this.hrService.createShift(data);
  }

  @Get('shifts/branch/:branchId')
  getShiftsByBranch(@Param('branchId', ParseIntPipe) branchId: number) {
    return this.hrService.getShiftsByBranch(branchId);
  }

  @Get('shifts/me')
  getMyShifts(@Request() req: any) {
    return this.hrService.getMyShifts(req.user.userId);
  }

  @Post('payroll/generate')
  generatePayrollRun(
    @Body('branchId', ParseIntPipe) branchId: number, 
    @Body('month', ParseIntPipe) month: number, 
    @Body('year', ParseIntPipe) year: number
  ) {
    return this.hrService.generatePayrollRun(branchId, month, year);
  }

  @Get('payroll-runs')
  getPayrollRuns(@Query('branchId', ParseIntPipe) branchId: number) {
    return this.hrService.getPayrollRuns(branchId);
  }

  @Patch('payroll-runs/:id/approve')
  approvePayrollRun(@Param('id', ParseIntPipe) id: number) {
    return this.hrService.approvePayrollRun(id);
  }

  @Patch('users/:userId/rate')
  updateHourlyRate(@Param('userId', ParseIntPipe) userId: number, @Body('hourlyRate') hourlyRate: number) {
    return this.hrService.updateHourlyRate(userId, Number(hourlyRate));
  }

  @Get('users')
  getAllUsers(@Query('branchId') branchId?: string) {
    return this.hrService.getAllUsers(branchId ? parseInt(branchId) : undefined);
  }
}
