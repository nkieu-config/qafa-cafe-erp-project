import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Tier } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; phone: string }) {
    const existing = await this.prisma.customer.findUnique({ where: { phone: data.phone } });
    if (existing) {
      throw new BadRequestException('Customer with this phone already exists');
    }
    return this.prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        points: 0,
        tier: 'REGULAR',
      },
    });
  }

  async findAll(search?: string) {
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
      ],
    } : {};
    return this.prisma.customer.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: number) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.customer.update({ where: { id }, data });
  }

  async findByPhone(phone: string) {
    const customer = await this.prisma.customer.findUnique({ where: { phone } });
    if (!customer) throw new BadRequestException('Customer not found');
    return customer;
  }

  // Calculate and update tier based on lifetime spend
  async checkAndUpdateTier(customerId: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { orders: true },
    });
    
    if (!customer) return;

    const lifetimeSpend = customer.orders.reduce((sum, order) => sum + order.netAmount, 0);
    
    let newTier: Tier = 'REGULAR';
    if (lifetimeSpend >= 50000) newTier = 'PLATINUM';
    else if (lifetimeSpend >= 20000) newTier = 'GOLD';
    else if (lifetimeSpend >= 5000) newTier = 'SILVER';

    if (newTier !== customer.tier) {
      await this.prisma.customer.update({
        where: { id: customerId },
        data: { tier: newTier },
      });
    }
  }
}
