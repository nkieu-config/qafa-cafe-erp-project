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
import { RefundOrderDto } from './dto/refund-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { assertBranchAccess, resolveBranchId } from '../auth/branch-scope.util';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { parseOptionalPositiveInt } from '../common/query-params.util';

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
      parseOptionalPositiveInt(branchIdQuery, 'branchId'),
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
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: RequestWithUser,
  ) {
    return this.ordersService.updateOrderStatus(id, dto.status, req.user);
  }

  @Post(':id/void')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'MANAGER')
  voidOrder(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.ordersService.voidOrder(id, req.user);
  }

  @Post(':id/refund')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'MANAGER')
  refundOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RefundOrderDto,
    @Request() req: RequestWithUser,
  ) {
    return this.ordersService.refundOrder(id, dto.reason, req.user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.ordersService.findOne(id, req.user);
  }
}
