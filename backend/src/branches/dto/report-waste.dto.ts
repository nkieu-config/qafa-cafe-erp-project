import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class ReportWasteDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  batchId?: number;

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
