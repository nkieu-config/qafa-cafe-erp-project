import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from './prisma.service';

export type MockPrismaService = DeepMockProxy<PrismaClient>;

export const createMockPrismaService = (): MockPrismaService => {
  return mockDeep<PrismaClient>() as unknown as MockPrismaService;
};

export const PrismaServiceMockProvider = {
  provide: PrismaService,
  useFactory: () => createMockPrismaService(),
};
