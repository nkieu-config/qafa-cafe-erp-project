import { Controller, Get, Post, Body, Param, ParseIntPipe, Patch, UseGuards, Req } from '@nestjs/common';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('orders')
  getProductionOrders() {
    return this.productionService.getProductionOrders();
  }

  @Get('boms')
  getBOMs() {
    return this.productionService.getBOMs();
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Post('orders')
  createOrder(@Body() data: { branchId: number, targetIngredientId: number, quantityToProduce: number, plannedStartDate?: Date }) {
    return this.productionService.createProductionOrder(data);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id', ParseIntPipe) id: number, @Body() data: { status: string }) {
    return this.productionService.updateOrderStatus(id, data.status);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Patch('orders/:id/complete')
  completeOrder(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.productionService.completeProductionOrder(id, req.user?.userId);
  }

  @Roles('SUPER_ADMIN')
  @Post('boms')
  createBOM(@Body() data: { targetIngredientId: number, rawIngredientId: number, quantityNeeded: number }) {
    return this.productionService.createBOM(data);
  }
}
