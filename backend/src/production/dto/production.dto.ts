import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { ProductionStatus } from '@prisma/client';

export class CreateProductionOrderDto {
  @IsInt()
  @IsPositive()
  branchId: number;

  @IsInt()
  @IsPositive()
  targetIngredientId: number;

  @IsNumber()
  @IsPositive()
  quantityToProduce: number;

  @IsOptional()
  @IsISO8601()
  plannedStartDate?: string;
}

export class UpdateProductionStatusDto {
  @IsEnum(ProductionStatus)
  status: ProductionStatus;
}

export class CreateBomDto {
  @IsInt()
  @IsPositive()
  targetIngredientId: number;

  @IsInt()
  @IsPositive()
  rawIngredientId: number;

  @IsNumber()
  @IsPositive()
  quantityNeeded: number;
}
