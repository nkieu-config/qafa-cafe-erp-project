import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { resolveBranchId } from '../auth/branch-scope.util';
import {
  CreateEquipmentDto,
  LogMaintenanceDto,
  UpdateEquipmentDto,
} from './dto/equipment.dto';

@UseGuards(JwtAuthGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  findAll(
    @Request() req: RequestWithUser,
    @Query('branchId') branchIdQuery?: string,
  ) {
    const branchId = resolveBranchId(
      req.user,
      branchIdQuery ? parseInt(branchIdQuery, 10) : undefined,
    );
    return this.equipmentService.findAll(branchId);
  }

  @Get(':id')
  findOne(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.equipmentService.findOne(id, req.user);
  }

  @Post()
  create(@Body() dto: CreateEquipmentDto, @Request() req: RequestWithUser) {
    const branchId = resolveBranchId(req.user, dto.branchId);
    return this.equipmentService.create({
      branchId,
      name: dto.name,
      type: dto.type,
      serialNumber: dto.serialNumber,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      warrantyExpiry: dto.warrantyExpiry
        ? new Date(dto.warrantyExpiry)
        : undefined,
      nextMaintenanceDate: dto.nextMaintenanceDate
        ? new Date(dto.nextMaintenanceDate)
        : undefined,
    });
  }

  @Patch(':id')
  update(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentDto,
  ) {
    const updateData: Record<string, unknown> = { ...dto };
    if (dto.purchaseDate) updateData.purchaseDate = new Date(dto.purchaseDate);
    if (dto.warrantyExpiry)
      updateData.warrantyExpiry = new Date(dto.warrantyExpiry);
    if (dto.nextMaintenanceDate)
      updateData.nextMaintenanceDate = new Date(dto.nextMaintenanceDate);
    return this.equipmentService.update(id, updateData, req.user);
  }

  @Post(':id/maintenance')
  logMaintenance(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LogMaintenanceDto,
  ) {
    return this.equipmentService.logMaintenance(
      id,
      {
        description: dto.description,
        cost: dto.cost,
        performedBy: dto.performedBy,
        date: dto.date ? new Date(dto.date) : new Date(),
        nextMaintenanceDate: dto.nextMaintenanceDate
          ? new Date(dto.nextMaintenanceDate)
          : undefined,
        newStatus: dto.newStatus,
      },
      req.user,
    );
  }
}
