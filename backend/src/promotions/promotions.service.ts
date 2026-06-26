import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiscountType } from '@prisma/client';
import { toNum } from '../common/decimal.util';

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
    return this.prisma.promotion.create({
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }

  async findAll() {
    return this.prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async toggleActive(id: number, isActive: boolean) {
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

    // Ensure discount doesn't exceed subtotal
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
