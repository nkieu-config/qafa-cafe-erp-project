import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Tier } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../orders/events/order-created.event';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private prisma: PrismaService) {}

  @OnEvent('order.created', { async: true })
  async handleOrderCreated(event: OrderCreatedEvent) {
    if (event.customerId) {
      this.logger.log(`Handling order.created event for CRM Customer ${event.customerId}`);
      this.checkAndUpdateTier(event.customerId).catch(err => 
        this.logger.error(`Failed to update tier for customer ${event.customerId}:`, err)
      );
    }
  }

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

  async update(id: number, data: Partial<{ name: string; email: string; phone: string }>) {
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

  async getCustomer360(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            items: { include: { product: true } }
          }
        },
      },
    });

    if (!customer) throw new BadRequestException('Customer not found');

    // Calculate Lifetime Spend
    const allOrders = await this.prisma.order.findMany({
      where: { customerId: id, status: { in: ['COMPLETED', 'PENDING', 'PREPARING'] } },
      include: { items: { include: { product: true } } },
    });

    const lifetimeSpend = allOrders.reduce((sum, order) => sum + order.netAmount, 0);

    // Calculate Next Tier
    let nextTier: string | null = null;
    let amountToNextTier = 0;
    let progressPercentage = 0;
    
    if (lifetimeSpend < 5000) {
      nextTier = 'SILVER';
      amountToNextTier = 5000 - lifetimeSpend;
      progressPercentage = (lifetimeSpend / 5000) * 100;
    } else if (lifetimeSpend < 20000) {
      nextTier = 'GOLD';
      amountToNextTier = 20000 - lifetimeSpend;
      progressPercentage = ((lifetimeSpend - 5000) / (20000 - 5000)) * 100;
    } else if (lifetimeSpend < 50000) {
      nextTier = 'PLATINUM';
      amountToNextTier = 50000 - lifetimeSpend;
      progressPercentage = ((lifetimeSpend - 20000) / (50000 - 20000)) * 100;
    } else {
      nextTier = 'MAX';
      progressPercentage = 100;
    }

    // Favorite Drinks
    const productCount: Record<string, { name: string; count: number }> = {};
    for (const order of allOrders) {
      for (const item of order.items) {
        if (!productCount[item.product.id]) {
          productCount[item.product.id] = { name: item.product.name, count: 0 };
        }
        productCount[item.product.id].count += item.quantity;
      }
    }
    
    const favoriteDrinks = Object.values(productCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Churn Risk
    let churnRisk = 'LOW';
    let daysSinceLastOrder = 0;
    if (customer.orders.length > 0) {
      const lastOrderDate = customer.orders[0].createdAt;
      const msDiff = new Date().getTime() - lastOrderDate.getTime();
      daysSinceLastOrder = Math.floor(msDiff / (1000 * 3600 * 24));
      
      if (daysSinceLastOrder > 60) churnRisk = 'HIGH';
      else if (daysSinceLastOrder > 30) churnRisk = 'MEDIUM';
    } else {
      churnRisk = 'HIGH'; // No orders yet
    }

    return {
      customer,
      lifetimeSpend,
      nextTier,
      amountToNextTier,
      progressPercentage,
      favoriteDrinks,
      churnRisk,
      daysSinceLastOrder,
      recentOrders: customer.orders,
    };
  }
}
