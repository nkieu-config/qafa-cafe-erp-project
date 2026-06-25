import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('FinanceController branch scope', () => {
  const managerUser = {
    userId: 10,
    email: 'mgr@test.com',
    role: 'MANAGER' as const,
    branchId: 2,
  };

  async function createController(financeService: Partial<FinanceService>) {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanceController],
      providers: [{ provide: FinanceService, useValue: financeService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    return module.get(FinanceController);
  }

  it('rejects settlement submission for another branch', async () => {
    const controller = await createController({ submitSettlement: jest.fn() });

    expect(() =>
      controller.submitSettlement(
        { branchId: 99, actualCash: 1000 } as any,
        { user: managerUser } as any,
      ),
    ).toThrow(ForbiddenException);
  });

  it('submits settlement for own branch', async () => {
    const financeService = { submitSettlement: jest.fn().mockResolvedValue({ id: 1 }) };
    const controller = await createController(financeService);

    await controller.submitSettlement(
      { branchId: 2, actualCash: 1000 } as any,
      { user: managerUser } as any,
    );

    expect(financeService.submitSettlement).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 2, actualCash: 1000 }),
    );
  });
});
