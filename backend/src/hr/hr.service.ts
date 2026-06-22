import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaveType, LeaveStatus } from '@prisma/client';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  // ==================== ATTENDANCE ====================
  async clockIn(userId: number, branchId: number) {
    const activeRecord = await this.prisma.attendanceRecord.findFirst({
      where: { userId, clockOut: null }
    });

    if (activeRecord) {
      throw new BadRequestException('You are already clocked in.');
    }

    return this.prisma.attendanceRecord.create({
      data: { userId, branchId }
    });
  }

  async clockOut(userId: number) {
    const activeRecord = await this.prisma.attendanceRecord.findFirst({
      where: { userId, clockOut: null }
    });

    if (!activeRecord) {
      throw new BadRequestException('You are not currently clocked in.');
    }

    const clockOutTime = new Date();
    const durationMs = clockOutTime.getTime() - activeRecord.clockIn.getTime();
    const totalHours = durationMs / (1000 * 60 * 60);

    return this.prisma.attendanceRecord.update({
      where: { id: activeRecord.id },
      data: { clockOut: clockOutTime, totalHours }
    });
  }

  async getMyAttendance(userId: number) {
    return this.prisma.attendanceRecord.findMany({
      where: { userId },
      include: { branch: true },
      orderBy: { clockIn: 'desc' },
      take: 30
    });
  }

  async getActiveClockIn(userId: number) {
    return this.prisma.attendanceRecord.findFirst({
      where: { userId, clockOut: null },
      include: { branch: true }
    });
  }

  // ==================== SHIFTS ====================
  async createShift(data: { userId: number; branchId: number; startTime: string; endTime: string }) {
    return this.prisma.shift.create({
      data: {
        userId: data.userId,
        branchId: data.branchId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime)
      }
    });
  }

  async getShiftsByBranch(branchId: number) {
    return this.prisma.shift.findMany({
      where: { branchId },
      include: { user: true },
      orderBy: { startTime: 'asc' }
    });
  }

  async getMyShifts(userId: number) {
    return this.prisma.shift.findMany({
      where: { userId },
      include: { branch: true },
      orderBy: { startTime: 'asc' }
    });
  }

  // ==================== LEAVE MANAGEMENT ====================
  async requestLeave(userId: number, data: { type: LeaveType, startDate: string, endDate: string, reason?: string }) {
    return this.prisma.leaveRequest.create({
      data: {
        userId,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason
      }
    });
  }

  async getLeaveRequests(branchId?: number) {
    return this.prisma.leaveRequest.findMany({
      where: branchId ? { user: { branchId } } : {},
      include: { user: { select: { name: true, branchId: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMyLeaveRequests(userId: number) {
    return this.prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async processLeaveRequest(id: number, status: LeaveStatus) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status }
    });
  }

  // ==================== PAYROLL ====================
  async generatePayrollRun(branchId: number, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const existingRun = await this.prisma.payrollRun.findFirst({
      where: { branchId, month, year }
    });
    if (existingRun) throw new BadRequestException('Payroll run already exists for this month.');

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        branchId,
        clockIn: { gte: startDate, lte: endDate },
        clockOut: { not: null }
      },
      include: { user: true }
    });

    const userMap = new Map<number, any>();

    for (const record of records) {
      const u = record.user;
      if (!userMap.has(u.id)) {
        userMap.set(u.id, {
          userId: u.id,
          hourlyRate: u.hourlyRate,
          baseSalary: u.baseSalary || 0,
          employmentType: u.employmentType || 'PART_TIME',
          standardHours: 0,
          otHours: 0
        });
      }

      const p = userMap.get(u.id);
      const hrs = record.totalHours || 0;
      if (hrs > 8) {
        p.standardHours += 8;
        p.otHours += (hrs - 8);
      } else {
        p.standardHours += hrs;
      }
    }

    const payslipsData = Array.from(userMap.values()).map(p => {
      const isFullTime = p.employmentType === 'FULL_TIME';
      const basePay = isFullTime ? p.baseSalary : (p.standardHours * p.hourlyRate);
      
      // Calculate OT rate. For Full Time, we might use (baseSalary / 240) * 1.5 as OT rate, or just standard hourlyRate if defined.
      // Let's use hourlyRate if available, else fallback
      const otRate = p.hourlyRate > 0 ? p.hourlyRate * 1.5 : (p.baseSalary / 240) * 1.5;
      const otPay = p.otHours * otRate;
      
      const bonuses = 0; // Default zero for now, can be adjusted by manager later
      const otherDeductions = 0;

      const grossPay = basePay + otPay + bonuses;
      
      const socialSecurity = Math.min(basePay * 0.05, 750);
      const taxDeduction = grossPay * 0.03;
      const netPay = grossPay - socialSecurity - taxDeduction - otherDeductions;

      return {
        userId: p.userId,
        standardHours: p.standardHours,
        otHours: p.otHours,
        basePay,
        otPay,
        bonuses,
        grossPay,
        socialSecurity,
        taxDeduction,
        otherDeductions,
        netPay
      };
    });

    return this.prisma.payrollRun.create({
      data: {
        branchId,
        month,
        year,
        payslips: {
          create: payslipsData
        }
      },
      include: { payslips: true }
    });
  }

  async getPayrollRuns(branchId: number) {
    return this.prisma.payrollRun.findMany({
      where: { branchId },
      include: { payslips: { include: { user: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });
  }

  async approvePayrollRun(runId: number) {
    return this.prisma.payrollRun.update({
      where: { id: runId },
      data: { status: 'APPROVED' }
    });
  }

  async updateHourlyRate(userId: number, hourlyRate: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { hourlyRate }
    });
  }

  async getAllUsers(branchId?: number) {
    return this.prisma.user.findMany({
      where: branchId ? { branchId } : {},
      select: { id: true, name: true, email: true, role: true, hourlyRate: true, branchId: true, employmentType: true, baseSalary: true }
    });
  }

  async createUser(data: any) {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: { id: true, name: true, email: true, role: true, branchId: true }
    });
  }

  async updateUser(id: number, data: any) {
    if (data.password) {
      const bcrypt = require('bcrypt');
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, branchId: true }
    });
  }
}
