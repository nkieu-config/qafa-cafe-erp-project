import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  MockPrismaService,
  PrismaServiceMockProvider,
} from '../prisma/prisma.service.mock';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, PrismaServiceMockProvider],
    }).compile();

    service = module.get(ProductsService);
    prisma = module.get(PrismaService);
    prisma.$transaction.mockImplementation(async (cb: Function) => cb(prisma));
  });

  it('replaces recipe items on update', async () => {
    prisma.recipeItem.deleteMany.mockResolvedValue({ count: 1 });
    prisma.recipeItem.createMany.mockResolvedValue({ count: 2 });
    prisma.product.update.mockResolvedValue({
      id: 1,
      name: 'Latte',
      recipeItems: [
        { ingredientId: 1, quantity: 18 },
        { ingredientId: 2, quantity: 200 },
      ],
    } as any);

    await service.update(1, {
      name: 'Latte',
      recipeItems: [
        { ingredientId: 1, quantity: 18 },
        { ingredientId: 2, quantity: 200 },
      ],
    });

    expect(prisma.recipeItem.deleteMany).toHaveBeenCalledWith({
      where: { productId: 1 },
    });
    expect(prisma.recipeItem.createMany).toHaveBeenCalledWith({
      data: [
        { productId: 1, ingredientId: 1, quantity: 18 },
        { productId: 1, ingredientId: 2, quantity: 200 },
      ],
    });
  });
});
