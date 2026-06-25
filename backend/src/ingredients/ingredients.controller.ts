import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { IngredientsService } from './ingredients.service';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { resolveBranchId } from '../auth/branch-scope.util';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get('inventory/branch')
  getBranchInventory(@Request() req: RequestWithUser, @Query('branchId') branchIdQuery?: string) {
    const branchId = resolveBranchId(
      req.user,
      branchIdQuery ? parseInt(branchIdQuery, 10) : undefined,
    );
    return this.ingredientsService.getBranchInventory(branchId);
  }

  @Get('waste/logs')
  getWasteLogs(@Request() req: RequestWithUser, @Query('branchId') branchIdQuery?: string) {
    const branchId = resolveBranchId(
      req.user,
      branchIdQuery ? parseInt(branchIdQuery, 10) : undefined,
    );
    return this.ingredientsService.getWasteLogs(branchId);
  }

  @Get()
  findAll() {
    return this.ingredientsService.findAll();
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Post()
  create(@Body() createIngredientDto: { name: string; unit: string; costPerUnit?: number; primarySupplierId?: number; isActive?: boolean }) {
    return this.ingredientsService.create(createIngredientDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ingredientsService.findOne(id);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateIngredientDto: Partial<{ name: string; unit: string; costPerUnit: number; primarySupplierId: number; isActive: boolean }>) {
    return this.ingredientsService.update(id, updateIngredientDto);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ingredientsService.remove(id);
  }
}
