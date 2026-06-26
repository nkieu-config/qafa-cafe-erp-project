import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    unit: string;
    costPerUnit?: number;
    primarySupplierId?: number;
    isActive?: boolean;
  }) {
    return this.prisma.ingredient.create({ data });
  }

  async findAll() {
    return this.prisma.ingredient.findMany({
      include: { primarySupplier: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.ingredient.findUnique({
      where: { id },
      include: { primarySupplier: true },
    });
  }

  async update(
    id: number,
    data: {
      name?: string;
      unit?: string;
      costPerUnit?: number;
      primarySupplierId?: number;
      isActive?: boolean;
    },
  ) {
    return this.prisma.ingredient.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.ingredient.delete({ where: { id } });
  }

  async getBranchInventory(branchId: number) {
    return this.prisma.branchInventory.findMany({
      where: { branchId },
      include: { ingredient: true },
    });
  }

  async getWasteLogs(branchId: number) {
    return this.prisma.wasteLog.findMany({
      where: { branchId },
      include: { ingredient: true, recordedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
