import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(data: { phone: string; name: string }) {
    // Basic formatting or validation could be added here
    return this.prisma.customer.create({ data });
  }

  async findAll() {
    return this.prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findByPhone(phone: string) {
    const customer = await this.prisma.customer.findUnique({ where: { phone } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }
}
