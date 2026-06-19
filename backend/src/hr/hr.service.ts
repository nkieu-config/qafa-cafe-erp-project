import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
      const basePay = p.standardHours * p.hourlyRate;
      const otPay = p.otHours * p.hourlyRate * 1.5;
      const grossPay = basePay + otPay;
      
      const socialSecurity = Math.min(basePay * 0.05, 750);
      const taxDeduction = grossPay * 0.03;
      const netPay = grossPay - socialSecurity - taxDeduction;

      return {
        userId: p.userId,
        standardHours: p.standardHours,
        otHours: p.otHours,
        basePay,
        otPay,
        grossPay,
        socialSecurity,
        taxDeduction,
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
      select: { id: true, name: true, email: true, role: true, hourlyRate: true, branchId: true }
    });
  }
}
