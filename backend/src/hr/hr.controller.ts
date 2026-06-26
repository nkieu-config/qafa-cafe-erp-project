import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  assertBranchAccess,
  resolveBranchId,
  resolveOptionalBranchId,
} from '../auth/branch-scope.util';
import { ClockInDto } from './dto/clock-in.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { RequestLeaveDto } from './dto/request-leave.dto';
import { ProcessLeaveDto } from './dto/process-leave.dto';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { UpdateHourlyRateDto } from './dto/update-hourly-rate.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Post('clock-in')
  clockIn(@Request() req: RequestWithUser, @Body() dto: ClockInDto) {
    assertBranchAccess(req.user, dto.branchId);
    return this.hrService.clockIn(req.user.userId, dto.branchId);
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
  createShift(@Request() req: RequestWithUser, @Body() dto: CreateShiftDto) {
    const branchId = resolveBranchId(req.user, dto.branchId);
    return this.hrService.createShift({ ...dto, branchId });
  }

  @Get('shifts/branch/:branchId')
  getShiftsByBranch(
    @Request() req: RequestWithUser,
    @Param('branchId', ParseIntPipe) branchId: number,
  ) {
    assertBranchAccess(req.user, branchId);
    return this.hrService.getShiftsByBranch(branchId);
  }

  @Get('shifts/me')
  getMyShifts(@Request() req: RequestWithUser) {
    return this.hrService.getMyShifts(req.user.userId);
  }

  @Post('leave')
  requestLeave(@Request() req: RequestWithUser, @Body() dto: RequestLeaveDto) {
    return this.hrService.requestLeave(req.user.userId, dto);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Get('leave')
  getLeaveRequests(
    @Request() req: RequestWithUser,
    @Query('branchId') branchId?: string,
  ) {
    const resolvedBranchId = resolveOptionalBranchId(
      req.user,
      branchId ? parseInt(branchId, 10) : undefined,
    );
    return this.hrService.getLeaveRequests(resolvedBranchId);
  }

  @Get('leave/me')
  getMyLeaveRequests(@Request() req: RequestWithUser) {
    return this.hrService.getMyLeaveRequests(req.user.userId);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Patch('leave/:id/status')
  processLeaveRequest(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProcessLeaveDto,
  ) {
    return this.hrService.processLeaveRequest(id, dto.status, req.user);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Post('payroll/generate')
  generatePayrollRun(
    @Request() req: RequestWithUser,
    @Body() dto: GeneratePayrollDto,
  ) {
    assertBranchAccess(req.user, dto.branchId);
    return this.hrService.generatePayrollRun(dto.branchId, dto.month, dto.year);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Get('payroll-runs')
  getPayrollRuns(
    @Request() req: RequestWithUser,
    @Query('branchId', ParseIntPipe) branchId: number,
  ) {
    assertBranchAccess(req.user, branchId);
    return this.hrService.getPayrollRuns(branchId);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Patch('payroll-runs/:id/approve')
  approvePayrollRun(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.hrService.approvePayrollRun(id, req.user);
  }

  @Roles('SUPER_ADMIN')
  @Patch('users/:userId/rate')
  updateHourlyRate(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateHourlyRateDto,
  ) {
    return this.hrService.updateHourlyRate(userId, dto.hourlyRate);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Get('users')
  getAllUsers(
    @Request() req: RequestWithUser,
    @Query('branchId') branchId?: string,
  ) {
    const resolvedBranchId = resolveOptionalBranchId(
      req.user,
      branchId ? parseInt(branchId, 10) : undefined,
    );
    return this.hrService.getAllUsers(resolvedBranchId);
  }

  @Roles('SUPER_ADMIN')
  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.hrService.createUser(dto);
  }

  @Roles('SUPER_ADMIN')
  @Patch('users/:id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.hrService.updateUser(id, dto);
  }
}
