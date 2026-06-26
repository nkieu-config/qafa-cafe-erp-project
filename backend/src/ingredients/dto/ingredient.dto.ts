import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  unit: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerUnit?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  primarySupplierId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateIngredientDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerUnit?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  primarySupplierId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
