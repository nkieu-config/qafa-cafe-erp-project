import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DiscountType } from '@prisma/client';
import { toNum } from '../common/decimal.util';
import { UpdatePromotionDto } from './dto/promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    code: string;
    description: string;
    discountType: DiscountType;
    discountValue: number;
    minPurchase?: number;
    startDate?: string;
    endDate?: string;
  }) {
    if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    try {
      return await this.prisma.promotion.create({
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'A promotion with this code already exists',
        );
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async update(id: number, dto: UpdatePromotionDto) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Promotion not found');
    }

    if (
      dto.discountType === 'PERCENTAGE' &&
      dto.discountValue != null &&
      dto.discountValue > 100
    ) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    const discountType = dto.discountType ?? existing.discountType;
    const discountValue = dto.discountValue ?? toNum(existing.discountValue);
    if (discountType === 'PERCENTAGE' && discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.discountType !== undefined && {
          discountType: dto.discountType,
        }),
        ...(dto.discountValue !== undefined && {
          discountValue: dto.discountValue,
        }),
        ...(dto.minPurchase !== undefined && {
          minPurchase: dto.minPurchase,
        }),
        ...(dto.startDate !== undefined && {
          startDate: dto.startDate ? new Date(dto.startDate) : null,
        }),
        ...(dto.endDate !== undefined && {
          endDate: dto.endDate ? new Date(dto.endDate) : null,
        }),
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.promotion.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Promotion not found');
    }
    if (existing._count.orders > 0) {
      throw new BadRequestException(
        'Cannot delete a promotion that has been used on orders',
      );
    }
    return this.prisma.promotion.delete({ where: { id } });
  }

  async toggleActive(id: number, isActive: boolean) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Promotion not found');
    }
    return this.prisma.promotion.update({ where: { id }, data: { isActive } });
  }

  async validateCode(code: string, subtotal: number) {
    const promo = await this.prisma.promotion.findUnique({ where: { code } });
    if (!promo) throw new NotFoundException('Promotion code not found');

    if (!promo.isActive)
      throw new BadRequestException('This promotion is no longer active');

    const now = new Date();
    if (promo.startDate && now < promo.startDate)
      throw new BadRequestException('This promotion has not started yet');
    if (promo.endDate && now > promo.endDate)
      throw new BadRequestException('This promotion has expired');

    if (promo.minPurchase && subtotal < toNum(promo.minPurchase)) {
      throw new BadRequestException(
        `Minimum purchase of ${toNum(promo.minPurchase)} required`,
      );
    }

    let discountAmount = 0;
    if (promo.discountType === 'PERCENTAGE') {
      discountAmount = subtotal * (toNum(promo.discountValue) / 100);
    } else if (promo.discountType === 'FIXED_AMOUNT') {
      discountAmount = toNum(promo.discountValue);
    }

    discountAmount = Math.min(discountAmount, subtotal);

    return {
      id: promo.id,
      code: promo.code,
      discountAmount,
      type: promo.discountType,
      value: promo.discountValue,
    };
  }
}
