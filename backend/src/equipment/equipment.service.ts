import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentType, EquipmentStatus, Prisma } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);

  constructor(private prisma: PrismaService) {}

  // Run every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.debug('Running daily equipment maintenance check...');
    await this.checkMaintenanceSchedules();
  }

  async checkMaintenanceSchedules() {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // Find all active equipment that need maintenance within 7 days
    const equipmentList = await this.prisma.equipment.findMany({
      where: {
        status: 'ACTIVE',
        nextMaintenanceDate: { lte: nextWeek }
      },
      include: { branch: true }
    });

    for (const eq of equipmentList) {
      this.logger.warn(`Alert: Equipment [${eq.name}] at Branch [${eq.branch.name}] is due for maintenance by ${eq.nextMaintenanceDate?.toLocaleDateString()}`);
      // In a real app, send an email, push notification, or WebSocket event here
    }
  }

  async findAll(branchId?: number) {
    return this.prisma.equipment.findMany({
      where: branchId ? { branchId } : undefined,
      include: { branch: true },
      orderBy: { id: 'asc' }
    });
  }

  async findOne(id: number) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: { branch: true, maintenanceLogs: { orderBy: { date: 'desc' } } }
    });
    if (!equipment) throw new NotFoundException('Equipment not found');
    return equipment;
  }

  async create(data: {
    branchId: number;
    name: string;
    type: EquipmentType;
    serialNumber?: string;
    purchaseDate?: Date;
    warrantyExpiry?: Date;
    nextMaintenanceDate?: Date;
  }) {
    return this.prisma.equipment.create({ data });
  }

  async update(id: number, data: Partial<{
    name: string;
    type: EquipmentType;
    serialNumber: string;
    status: EquipmentStatus;
    purchaseDate: Date;
    warrantyExpiry: Date;
    nextMaintenanceDate: Date;
  }>) {
    return this.prisma.equipment.update({
      where: { id },
      data
    });
  }

  async logMaintenance(equipmentId: number, data: {
    description: string;
    cost: number;
    performedBy?: string;
    date: Date;
    nextMaintenanceDate?: Date;
    newStatus?: EquipmentStatus;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.create({
        data: {
          equipmentId,
          description: data.description,
          cost: data.cost,
          performedBy: data.performedBy,
          date: data.date
        }
      });

      const updateData: Prisma.EquipmentUpdateInput = {};
      if (data.nextMaintenanceDate) updateData.nextMaintenanceDate = data.nextMaintenanceDate;
      if (data.newStatus) updateData.status = data.newStatus;

      if (Object.keys(updateData).length > 0) {
        await tx.equipment.update({
          where: { id: equipmentId },
          data: updateData
        });
      }

      return log;
    });
  }
}
