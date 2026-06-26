import {
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class AddInventoryBatchDto {
  @IsInt()
  @IsPositive()
  ingredientId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsISO8601()
  expiryDate?: string;
}
