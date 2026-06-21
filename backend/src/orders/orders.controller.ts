import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Request, Query, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { OrderStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Request() req: RequestWithUser) {
    return this.ordersService.createOrder({
      ...createOrderDto,
      userId: req.user.userId,
      branchId: req.user.branchId || createOrderDto.branchId || 1,
    });
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
  updateOrderStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: OrderStatus) {
    return this.ordersService.updateOrderStatus(id, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }
}
