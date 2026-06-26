import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { EquipmentStatus, EquipmentType } from '@prisma/client';

export class CreateEquipmentDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  branchId?: number;

  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(EquipmentType)
  type: EquipmentType;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsISO8601()
  purchaseDate?: string;

  @IsOptional()
  @IsISO8601()
  warrantyExpiry?: string;

  @IsOptional()
  @IsISO8601()
  nextMaintenanceDate?: string;
}

export class UpdateEquipmentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(EquipmentType)
  type?: EquipmentType;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsISO8601()
  purchaseDate?: string;

  @IsOptional()
  @IsISO8601()
  warrantyExpiry?: string;

  @IsOptional()
  @IsISO8601()
  nextMaintenanceDate?: string;
}

export class LogMaintenanceDto {
  @IsString()
  @MinLength(1)
  description: string;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsOptional()
  @IsString()
  performedBy?: string;

  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @IsISO8601()
  nextMaintenanceDate?: string;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  newStatus?: EquipmentStatus;
}
