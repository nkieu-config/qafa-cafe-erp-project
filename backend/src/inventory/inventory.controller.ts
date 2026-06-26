import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { assertBranchAccess } from '../auth/branch-scope.util';
import { RecordWasteDto, StockInDto } from './dto/inventory.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('branch/:branchId/balance')
  @Roles('SUPER_ADMIN', 'MANAGER', 'STAFF')
  getBalance(
    @Request() req: RequestWithUser,
    @Param('branchId', ParseIntPipe) branchId: number,
  ) {
    assertBranchAccess(req.user, branchId);
    return this.inventoryService.getBalance(branchId);
  }

  @Post('branch/:branchId/stock-in')
  @Roles('SUPER_ADMIN', 'MANAGER')
  receiveStock(
    @Request() req: RequestWithUser,
    @Param('branchId', ParseIntPipe) branchId: number,
    @Body() dto: StockInDto,
  ) {
    assertBranchAccess(req.user, branchId);
    return this.inventoryService.receiveStock(branchId, {
      items: dto.items.map((item) => ({
        ...item,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
      })),
    });
  }

  @Post('branch/:branchId/waste')
  @Roles('SUPER_ADMIN', 'MANAGER', 'STAFF')
  recordWaste(
    @Request() req: RequestWithUser,
    @Param('branchId', ParseIntPipe) branchId: number,
    @Body() dto: RecordWasteDto,
  ) {
    assertBranchAccess(req.user, branchId);
    return this.inventoryService.recordWaste(branchId, req.user.userId, dto);
  }
}
