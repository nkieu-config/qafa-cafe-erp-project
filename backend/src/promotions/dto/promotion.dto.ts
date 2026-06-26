import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { DiscountType } from '@prisma/client';

export class CreatePromotionDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchase?: number;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;
}

export class ValidatePromotionDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsNumber()
  @Min(0)
  subtotal: number;
}

export class TogglePromotionDto {
  @IsBoolean()
  isActive: boolean;
}
