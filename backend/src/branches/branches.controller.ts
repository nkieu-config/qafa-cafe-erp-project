import { Controller, Get, Post, Body, Param, ParseIntPipe, Request, UseGuards, Patch } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { assertBranchAccess } from '../auth/branch-scope.util';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @Roles('SUPER_ADMIN')
  @Post()
  createBranch(@Body() data: { name: string; location?: string; isCentralKitchen?: boolean }) {
    return this.branchesService.createBranch(data);
  }

  @Get('transfers/all')
  getAllTransfers() {
    return this.branchesService.getAllTransfers();
  }

  @Post('transfers')
  createTransfer(@Body() data: { fromBranchId: number, toBranchId: number, ingredientId: number, quantity: number }, @Request() req: RequestWithUser) {
    assertBranchAccess(req.user, data.fromBranchId);
    return this.branchesService.createTransfer({
      ...data,
      requestedById: req.user.userId
    });
  }

  @Post('transfers/:id/accept')
  acceptTransfer(@Param('id', ParseIntPipe) id: number, @Request() req: RequestWithUser) {
    return this.branchesService.acceptTransfer(id, req.user.userId);
  }

  @Roles('SUPER_ADMIN')
  @Patch(':id')
  updateBranch(@Param('id', ParseIntPipe) id: number, @Body() data: { name?: string; location?: string; isCentralKitchen?: boolean }) {
    return this.branchesService.updateBranch(id, data);
  }

  @Get(':id/transfers')
  getTransfers(@Param('id', ParseIntPipe) id: number, @Request() req: RequestWithUser) {
    assertBranchAccess(req.user, id);
    return this.branchesService.getTransfers(id);
  }

  @Post(':id/batches')
  addInventoryBatch(@Param('id', ParseIntPipe) id: number, @Body() data: { ingredientId: number, quantity: number, expiryDate?: string }, @Request() req: RequestWithUser) {
    assertBranchAccess(req.user, id);
    return this.branchesService.addInventoryBatch(id, data, req.user.userId);
  }

  @Post(':id/waste')
  reportWaste(@Param('id', ParseIntPipe) id: number, @Body() data: { batchId?: number, ingredientId: number, quantity: number, reason: string }, @Request() req: RequestWithUser) {
    assertBranchAccess(req.user, id);
    return this.branchesService.reportWaste(id, data, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: RequestWithUser) {
    assertBranchAccess(req.user, id);
    return this.branchesService.findOne(id);
  }
}
