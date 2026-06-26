import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import {
  resolveBranchId,
  resolveOptionalBranchId,
} from '../auth/branch-scope.util';
import {
  CreateBomDto,
  CreateProductionOrderDto,
  UpdateProductionStatusDto,
} from './dto/production.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('orders')
  getProductionOrders(@Req() req: RequestWithUser) {
    const branchId = resolveOptionalBranchId(req.user);
    return this.productionService.getProductionOrders(branchId);
  }

  @Get('boms')
  getBOMs() {
    return this.productionService.getBOMs();
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Post('orders')
  createOrder(
    @Req() req: RequestWithUser,
    @Body() dto: CreateProductionOrderDto,
  ) {
    const branchId = resolveBranchId(req.user, dto.branchId);
    return this.productionService.createProductionOrder({
      branchId,
      targetIngredientId: dto.targetIngredientId,
      quantityToProduce: dto.quantityToProduce,
      plannedStartDate: dto.plannedStartDate
        ? new Date(dto.plannedStartDate)
        : undefined,
    });
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Patch('orders/:id/status')
  updateOrderStatus(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductionStatusDto,
  ) {
    return this.productionService.updateOrderStatus(id, dto.status, req.user);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Patch('orders/:id/complete')
  completeOrder(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.productionService.completeProductionOrder(
      id,
      req.user?.userId,
      req.user,
    );
  }

  @Roles('SUPER_ADMIN')
  @Post('boms')
  createBOM(@Body() dto: CreateBomDto) {
    return this.productionService.createBOM(dto);
  }
}
