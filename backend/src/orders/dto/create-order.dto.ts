import {
  IsInt,
  IsPositive,
  IsArray,
  ValidateNested,
  IsOptional,
  IsString,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class OrderItemDto {
  @IsInt()
  @IsPositive()
  productId: number;

  @IsInt()
  @IsPositive()
  quantity: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  branchId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  promotionCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  pointsToRedeem?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  isTaxInvoiceRequested?: boolean;

  @IsOptional()
  @IsString()
  taxInvoiceName?: string;

  @IsOptional()
  @IsString()
  taxInvoiceTaxId?: string;

  @IsOptional()
  @IsString()
  taxInvoiceAddress?: string;
}
