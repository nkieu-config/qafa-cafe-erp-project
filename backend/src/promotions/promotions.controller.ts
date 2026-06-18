import { Controller, Get, Post, Body, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DiscountType } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  create(@Body() data: { code: string; description: string; discountType: DiscountType; discountValue: number; minPurchase?: number; startDate?: string; endDate?: string }) {
    return this.promotionsService.create(data);
  }

  @Get()
  findAll() {
    return this.promotionsService.findAll();
  }

  @Patch(':id/toggle')
  toggleActive(@Param('id', ParseIntPipe) id: number, @Body('isActive') isActive: boolean) {
    return this.promotionsService.toggleActive(id, isActive);
  }

  @Post('validate')
  validateCode(@Body() data: { code: string; subtotal: number }) {
    return this.promotionsService.validateCode(data.code, data.subtotal);
  }
}
