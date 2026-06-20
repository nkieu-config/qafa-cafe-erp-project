import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IngredientsService } from './ingredients.service';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  create(@Body() createIngredientDto: { name: string; unit: string; costPerUnit?: number; primarySupplierId?: number }) {
    return this.ingredientsService.create(createIngredientDto);
  }

  @Get()
  findAll() {
    return this.ingredientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ingredientsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateIngredientDto: any) {
    return this.ingredientsService.update(id, updateIngredientDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ingredientsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('inventory/branch')
  getBranchInventory(@Request() req: any, @Query('branchId') branchIdQuery?: string) {
    const branchId = branchIdQuery ? parseInt(branchIdQuery) : (req.user.branchId || 1);
    return this.ingredientsService.getBranchInventory(branchId);
  }


  @UseGuards(JwtAuthGuard)
  @Get('waste/logs')
  getWasteLogs(@Request() req: any, @Query('branchId') branchIdQuery?: string) {
    const branchId = branchIdQuery ? parseInt(branchIdQuery) : (req.user.branchId || 1);
    return this.ingredientsService.getWasteLogs(branchId);
  }
}
