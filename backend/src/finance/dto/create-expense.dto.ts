import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateExpenseDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  branchId?: number;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @MinLength(1)
  category: string;

  @IsOptional()
  @IsString()
  description?: string;
}
