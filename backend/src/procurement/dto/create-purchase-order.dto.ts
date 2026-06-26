import {
  IsArray,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderItemDto {
  @IsInt()
  @IsPositive()
  ingredientId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreatePurchaseOrderDto {
  @IsInt()
  @IsPositive()
  branchId: number;

  @IsInt()
  @IsPositive()
  supplierId: number;

  @IsOptional()
  @IsISO8601()
  expectedDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}
