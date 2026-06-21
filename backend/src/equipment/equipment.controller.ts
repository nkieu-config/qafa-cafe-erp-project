import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe, Query, UseGuards, Request } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EquipmentType, EquipmentStatus } from '@prisma/client';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  findAll(@Request() req: RequestWithUser, @Query('branchId') branchIdQuery?: string) {
    let branchId = branchIdQuery ? parseInt(branchIdQuery) : undefined;
    if (req.user.role !== 'SUPER_ADMIN' && !branchId) {
      branchId = req.user.branchId || 1;
    }
    return this.equipmentService.findAll(branchId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentService.findOne(id);
  }

  @Post()
  create(@Body() body: {
    branchId?: number;
    name: string;
    type: EquipmentType;
    serialNumber?: string;
    purchaseDate?: string;
    warrantyExpiry?: string;
    nextMaintenanceDate?: string;
  }, @Request() req: RequestWithUser) {
    const branchId = body.branchId || req.user.branchId || 1;
    return this.equipmentService.create({
      ...body,
      branchId,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
      warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : undefined,
      nextMaintenanceDate: body.nextMaintenanceDate ? new Date(body.nextMaintenanceDate) : undefined,
    });
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<{ name: string; type: EquipmentType; serialNumber: string; status: EquipmentStatus; purchaseDate: string; warrantyExpiry: string; nextMaintenanceDate: string }>) {
    const updateData: any = { ...body };
    if (body.purchaseDate) updateData.purchaseDate = new Date(body.purchaseDate);
    if (body.warrantyExpiry) updateData.warrantyExpiry = new Date(body.warrantyExpiry);
    if (body.nextMaintenanceDate) updateData.nextMaintenanceDate = new Date(body.nextMaintenanceDate);
    return this.equipmentService.update(id, updateData);
  }

  @Post(':id/maintenance')
  logMaintenance(@Param('id', ParseIntPipe) id: number, @Body() body: {
    description: string;
    cost: number;
    performedBy?: string;
    date?: string;
    nextMaintenanceDate?: string;
    newStatus?: EquipmentStatus;
  }) {
    return this.equipmentService.logMaintenance(id, {
      description: body.description,
      cost: body.cost,
      performedBy: body.performedBy,
      date: body.date ? new Date(body.date) : new Date(),
      nextMaintenanceDate: body.nextMaintenanceDate ? new Date(body.nextMaintenanceDate) : undefined,
      newStatus: body.newStatus
    });
  }
}
