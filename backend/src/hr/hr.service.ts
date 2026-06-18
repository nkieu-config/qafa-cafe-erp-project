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
  async getPayroll(branchId: number, month: number, year: number) {
    // Generate start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        branchId,
        clockIn: { gte: startDate, lte: endDate },
        clockOut: { not: null }
      },
      include: { user: true }
    });

    const payrollMap = new Map<number, any>();

    for (const record of records) {
      const u = record.user;
      if (!payrollMap.has(u.id)) {
        payrollMap.set(u.id, {
          userId: u.id,
          name: u.name,
          email: u.email,
          hourlyRate: u.hourlyRate,
          totalHours: 0,
          totalPay: 0
        });
      }

      const p = payrollMap.get(u.id);
      p.totalHours += record.totalHours || 0;
      p.totalPay = p.totalHours * p.hourlyRate;
    }

    return Array.from(payrollMap.values());
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
