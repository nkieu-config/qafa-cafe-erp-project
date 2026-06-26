import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_COOKIE_NAME } from './auth-cookie.util';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    login: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
    jest.clearAllMocks();
  });

  it('sets httpOnly auth cookie on login', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'signed-jwt',
      user: {
        id: 1,
        email: 'a@b.com',
        name: 'A',
        role: 'STAFF',
        branchId: 1,
        branch: 'B',
      },
    });

    const cookie = jest.fn();
    const res = { cookie } as unknown as Response;

    const body = await controller.login(
      { email: 'a@b.com', password: 'secret' },
      res,
    );

    expect(body).toEqual({
      user: expect.objectContaining({ email: 'a@b.com' }),
    });
    expect(cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      'signed-jwt',
      expect.objectContaining({ httpOnly: true }),
    );
  });
});
