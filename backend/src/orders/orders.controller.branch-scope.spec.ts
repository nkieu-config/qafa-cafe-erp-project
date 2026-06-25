import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('OrdersController branch scope', () => {
  const staffUser = {
    userId: 5,
    email: 'staff@test.com',
    role: 'STAFF' as const,
    branchId: 2,
  };

  async function createController(ordersService: Partial<OrdersService>) {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    return module.get(OrdersController);
  }

  it('rejects KDS access for another branch', async () => {
    const controller = await createController({ getKdsOrders: jest.fn() });

    expect(() =>
      controller.getKdsOrders(99, { user: staffUser } as any),
    ).toThrow(ForbiddenException);
  });

  it('rejects order creation for another branch', async () => {
    const controller = await createController({ createOrder: jest.fn() });

    expect(() =>
      controller.create(
        { branchId: 99, items: [{ productId: 1, quantity: 1 }] } as any,
        { user: staffUser } as any,
      ),
    ).toThrow(ForbiddenException);
  });

  it('creates order for own branch', async () => {
    const ordersService = { createOrder: jest.fn().mockResolvedValue({ id: 1 }) };
    const controller = await createController(ordersService);

    await controller.create(
      { branchId: 2, items: [{ productId: 1, quantity: 1 }] } as any,
      { user: staffUser } as any,
    );

    expect(ordersService.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 2 }),
    );
  });
});
