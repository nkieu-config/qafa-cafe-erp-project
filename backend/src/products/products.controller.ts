import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Post()
  create(@Body() createProductDto: { name: string; description?: string; price: number; category: string; isActive?: boolean; branchId?: number; recipeItems?: { ingredientId: number; quantity: number }[] }) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: Partial<{ name: string; description?: string; price: number; category: string; isActive?: boolean; branchId?: number; recipeItems?: { ingredientId: number; quantity: number }[] }>) {
    return this.productsService.update(id, updateProductDto);
  }

  @Roles('SUPER_ADMIN', 'MANAGER')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
