import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
  Patch,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { OrderStatus } from '@prisma/client';
import { assertBranchAccess, resolveBranchId } from '../auth/branch-scope.util';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: RequestWithUser,
  ) {
    const branchId = resolveBranchId(req.user, createOrderDto.branchId);
    return this.ordersService.createOrder({
      ...createOrderDto,
      userId: req.user.userId,
      branchId,
    });
  }

  @Get()
  findAll(
    @Request() req: RequestWithUser,
    @Query('branchId') branchIdQuery?: string,
  ) {
    if (req.user.role === 'SUPER_ADMIN' && !branchIdQuery) {
      return this.ordersService.findAll();
    }
    const branchId = resolveBranchId(
      req.user,
      branchIdQuery ? parseInt(branchIdQuery, 10) : undefined,
    );
    return this.ordersService.findByBranch(branchId);
  }

  @Get('kds')
  getKdsOrders(
    @Query('branchId', ParseIntPipe) branchId: number,
    @Request() req: RequestWithUser,
  ) {
    assertBranchAccess(req.user, branchId);
    return this.ordersService.getKdsOrders(branchId);
  }

  @Patch(':id/status')
  updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: OrderStatus,
    @Request() req: RequestWithUser,
  ) {
    return this.ordersService.updateOrderStatus(id, status, req.user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.ordersService.findOne(id, req.user);
  }
}
