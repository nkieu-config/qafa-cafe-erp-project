import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('BranchesController branch scope', () => {
  const staffUser = {
    userId: 5,
    email: 'staff@test.com',
    role: 'STAFF' as const,
    branchId: 2,
  };

  async function createController(branchesService: Partial<BranchesService>) {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchesController],
      providers: [{ provide: BranchesService, useValue: branchesService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    return module.get(BranchesController);
  }

  it('rejects transfer from another branch', async () => {
    const controller = await createController({ createTransfer: jest.fn() });

    expect(() =>
      controller.createTransfer(
        { fromBranchId: 99, toBranchId: 2, ingredientId: 1, quantity: 5 } as any,
        { user: staffUser } as any,
      ),
    ).toThrow(ForbiddenException);
  });

  it('lists only own branch for non-admin users', async () => {
    const branchesService = { findAll: jest.fn().mockResolvedValue([]) };
    const controller = await createController(branchesService);

    await controller.findAll({ user: staffUser } as any);

    expect(branchesService.findAll).toHaveBeenCalledWith(2);
  });
});
