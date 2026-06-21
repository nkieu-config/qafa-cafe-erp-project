import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Patch, Req } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get()
  findAll() {
    return this.procurementService.findAllPOs();
  }

  @Roles('SUPER_ADMIN', 'MANAGER', 'STAFF') // Allow staff to create PO (Draft/Pending)
  @Post()
  create(@Body() data: { branchId: number, supplierId: number, expectedDate?: string, items: { ingredientId: number, quantity: number, unitPrice: number }[] }, @Req() req: RequestWithUser) {
    const formattedData = { ...data, items: data.items.map(i => ({ ...i, price: i.unitPrice })) };
    return this.procurementService.createPO(formattedData, req.user.userId);
  }

  @Roles('SUPER_ADMIN', 'MANAGER') // Only managers can approve
  @Patch(':id/approve')
  approve(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.procurementService.approvePO(id, req.user.userId);
  }

  @Roles('SUPER_ADMIN', 'MANAGER') // Only managers can reject
  @Patch(':id/reject')
  reject(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.procurementService.rejectPO(id, req.user.userId);
  }

  @Roles('SUPER_ADMIN', 'MANAGER', 'STAFF') // Staff can receive if it's approved
  @Post(':id/receive')
  receive(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.procurementService.receivePO(id, req.user.userId);
  }
}
