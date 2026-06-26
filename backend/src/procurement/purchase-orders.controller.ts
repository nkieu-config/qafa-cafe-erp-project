import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Patch,
  Req,
} from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import {
  resolveBranchId,
  resolveOptionalBranchId,
} from '../auth/branch-scope.util';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get()
  findAll(@Req() req: RequestWithUser) {
    const branchId = resolveOptionalBranchId(req.user);
    return this.procurementService.findAllPOs(branchId);
  }

  @Roles('SUPER_ADMIN', 'MANAGER', 'STAFF')
  @Post()
  create(@Body() dto: CreatePurchaseOrderDto, @Req() req: RequestWithUser) {
    const branchId = resolveBranchId(req.user, dto.branchId);
    return this.procurementService.createPO(
      {
        branchId,
        supplierId: dto.supplierId,
        items: dto.items.map((i) => ({
          ingredientId: i.ingredientId,
          quantity: i.quantity,
          price: i.unitPrice,
        })),
      },
      req.user.userId,
    );
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Patch(':id/approve')
  approve(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.procurementService.approvePO(id, req.user.userId, req.user);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Patch(':id/reject')
  reject(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.procurementService.rejectPO(id, req.user.userId, req.user);
  }

  @Roles('SUPER_ADMIN', 'MANAGER', 'STAFF')
  @Post(':id/receive')
  receive(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.procurementService.receivePO(
      id,
      req.user.userId,
      undefined,
      req.user,
    );
  }
}
