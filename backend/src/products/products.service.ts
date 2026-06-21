import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; price: number; category: string; isActive?: boolean; recipeItems?: { ingredientId: number, quantity: number }[] }) {
    const { recipeItems, ...productData } = data;
    return this.prisma.product.create({
      data: {
        ...productData,
        recipeItems: recipeItems ? {
          create: recipeItems
        } : undefined
      },
      include: { recipeItems: true }
    });
  }

  async findAll() {
    return this.prisma.product.findMany({ include: { recipeItems: true } });
  }

  async findOne(id: number) {
    return this.prisma.product.findUnique({ where: { id }, include: { recipeItems: true } });
  }

  async update(id: number, data: Partial<{ name: string; description?: string; price: number; category: string; isActive?: boolean; branchId?: number; recipeItems?: { ingredientId: number; quantity: number }[] }>) {
    const { recipeItems, ...updateData } = data;
    return this.prisma.product.update({ where: { id }, data: updateData });
  }

  async remove(id: number) {
    // Use a transaction so if product deletion fails (e.g. due to being used in OrderItems),
    // the recipe items are not accidentally deleted (rolled back).
    return this.prisma.$transaction(async (prisma) => {
      await prisma.recipeItem.deleteMany({ where: { productId: id } });
      return prisma.product.delete({ where: { id } });
    });
  }
}
