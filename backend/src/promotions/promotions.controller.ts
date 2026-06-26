import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreatePromotionDto,
  TogglePromotionDto,
  ValidatePromotionDto,
} from './dto/promotion.dto';

@UseGuards(JwtAuthGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @Get()
  findAll() {
    return this.promotionsService.findAll();
  }

  @Patch(':id/toggle')
  toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TogglePromotionDto,
  ) {
    return this.promotionsService.toggleActive(id, dto.isActive);
  }

  @Post('validate')
  validateCode(@Body() dto: ValidatePromotionDto) {
    return this.promotionsService.validateCode(dto.code, dto.subtotal);
  }
}
