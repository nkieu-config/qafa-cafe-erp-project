import { Controller, Get, Post, Body, Param, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.findOne(id);
  }

  @Post('transfers')
  createTransfer(@Body() data: { fromBranchId: number, toBranchId: number, ingredientId: number, quantity: number }, @Request() req: RequestWithUser) {
    return this.branchesService.createTransfer({
      ...data,
      requestedById: req.user.userId
    });
  }

  @Get(':id/transfers')
  getTransfers(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.getTransfers(id);
  }

  @Post('transfers/:id/accept')
  acceptTransfer(@Param('id', ParseIntPipe) id: number, @Request() req: RequestWithUser) {
    return this.branchesService.acceptTransfer(id, req.user.userId);
  }

  @Post(':id/batches')
  addInventoryBatch(@Param('id', ParseIntPipe) id: number, @Body() data: { ingredientId: number, quantity: number, expiryDate?: string }, @Request() req: RequestWithUser) {
    return this.branchesService.addInventoryBatch(id, data, req.user.userId);
  }

  @Post(':id/waste')
  reportWaste(@Param('id', ParseIntPipe) id: number, @Body() data: { batchId?: number, ingredientId: number, quantity: number, reason: string }, @Request() req: RequestWithUser) {
    return this.branchesService.reportWaste(id, data, req.user.userId);
  }
}
