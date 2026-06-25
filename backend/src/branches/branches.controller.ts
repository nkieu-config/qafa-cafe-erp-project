import { Controller, Get, Post, Body, Param, ParseIntPipe, Request, UseGuards, Patch } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { assertBranchAccess, resolveBranchId } from '../auth/branch-scope.util';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { AddInventoryBatchDto } from './dto/add-inventory-batch.dto';
import { ReportWasteDto } from './dto/report-waste.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll(@Request() req: RequestWithUser) {
    if (req.user.role === 'SUPER_ADMIN') {
      return this.branchesService.findAll();
    }
    const branchId = resolveBranchId(req.user);
    return this.branchesService.findAll(branchId);
  }

  @Roles('SUPER_ADMIN')
  @Post()
  createBranch(@Body() dto: CreateBranchDto) {
    return this.branchesService.createBranch(dto);
  }

  @Get('transfers/all')
  getAllTransfers(@Request() req: RequestWithUser) {
    if (req.user.role === 'SUPER_ADMIN') {
      return this.branchesService.getAllTransfers();
    }
    const branchId = resolveBranchId(req.user);
    return this.branchesService.getTransfers(branchId);
  }

  @Post('transfers')
  createTransfer(@Body() dto: CreateTransferDto, @Request() req: RequestWithUser) {
    assertBranchAccess(req.user, dto.fromBranchId);
    if (req.user.role !== 'SUPER_ADMIN') {
      assertBranchAccess(req.user, dto.toBranchId);
    }
    return this.branchesService.createTransfer({
      ...dto,
      requestedById: req.user.userId,
    });
  }

  @Post('transfers/:id/accept')
  acceptTransfer(@Param('id', ParseIntPipe) id: number, @Request() req: RequestWithUser) {
    return this.branchesService.acceptTransfer(id, req.user.userId, req.user);
  }

  @Roles('SUPER_ADMIN')
  @Patch(':id')
  updateBranch(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBranchDto) {
    return this.branchesService.updateBranch(id, dto);
  }

  @Get(':id/transfers')
  getTransfers(@Param('id', ParseIntPipe) id: number, @Request() req: RequestWithUser) {
    assertBranchAccess(req.user, id);
    return this.branchesService.getTransfers(id);
  }

  @Post(':id/batches')
  addInventoryBatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddInventoryBatchDto,
    @Request() req: RequestWithUser,
  ) {
    assertBranchAccess(req.user, id);
    return this.branchesService.addInventoryBatch(id, dto, req.user.userId);
  }

  @Post(':id/waste')
  reportWaste(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReportWasteDto,
    @Request() req: RequestWithUser,
  ) {
    assertBranchAccess(req.user, id);
    return this.branchesService.reportWaste(id, dto, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: RequestWithUser) {
    assertBranchAccess(req.user, id);
    return this.branchesService.findOne(id);
  }
}
