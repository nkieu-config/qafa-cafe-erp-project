import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Request, Query, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: any, @Request() req: any) {
    // Inject userId and branchId from JWT token payload (req.user is set by Passport)
    const data = {
      ...createOrderDto,
      userId: req.user.userId,
      branchId: req.user.branchId || createOrderDto.branchId,
    };
    return this.ordersService.createOrder(data);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('kds')
  getKdsOrders(@Query('branchId', ParseIntPipe) branchId: number) {
    return this.ordersService.getKdsOrders(branchId);
  }

  @Patch(':id/status')
  updateOrderStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.ordersService.updateOrderStatus(id, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }
}
