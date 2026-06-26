import {
  IsArray,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StockInItemDto {
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

export class StockInDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockInItemDto)
  items: StockInItemDto[];
}

export class WasteItemDto {
  @IsInt()
  @IsPositive()
  ingredientId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsString()
  @MinLength(1)
  reason: string;
}

export class RecordWasteDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WasteItemDto)
  items: WasteItemDto[];
}
