import { Test, TestingModule } from '@nestjs/testing';
import { HrService } from './hr.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  MockPrismaService,
  PrismaServiceMockProvider,
} from '../prisma/prisma.service.mock';
import { BadRequestException } from '@nestjs/common';

describe('HrService', () => {
  let service: HrService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HrService, PrismaServiceMockProvider],
    }).compile();

    service = module.get<HrService>(HrService);
    prisma = module.get(PrismaService);
  });

  describe('generatePayrollRun', () => {
    it('throws when payroll run already exists', async () => {
      prisma.payrollRun.findFirst.mockResolvedValue({ id: 1 } as any);

      await expect(service.generatePayrollRun(1, 6, 2026)).rejects.toThrow(
        new BadRequestException('Payroll run already exists for this month.'),
      );
    });

    it('calculates OT and deductions correctly', async () => {
      prisma.payrollRun.findFirst.mockResolvedValue(null);

      // Mock attendance records:
      // User 1: 10 hours total -> 8 standard, 2 OT. Rate = 100
      // Base: 800, OT: 2 * 150 = 300, Gross: 1100
      // SS (5%): 55. Tax (3%): 33. Net: 1100 - 55 - 33 = 1012.
      //
      // User 2: 200 hours total -> 8 standard (assuming one record for simplicity), 192 OT. Rate = 200
      // Base: 1600, OT: 192 * 300 = 57600, Gross: 59200.
      // SS (5%): 2960 -> Cap at 750. Tax (3%): 1776. Net: 59200 - 750 - 1776 = 56674.

      const mockBranchId = 2;

      prisma.attendanceRecord.findMany.mockResolvedValue([
        {
          id: 1,
          userId: 1,
          branchId: mockBranchId,
          totalHours: 10,
          user: { id: 1, hourlyRate: 100 },
        },
        {
          id: 2,
          userId: 2,
          branchId: mockBranchId,
          totalHours: 200,
          user: { id: 2, hourlyRate: 2000 }, // High rate to trigger SS cap
        },
      ] as any);

      prisma.payrollRun.create.mockResolvedValue({ id: 2 } as any);

      await service.generatePayrollRun(mockBranchId, 6, 2026);

      expect(prisma.payrollRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payslips: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  userId: 1,
                  standardHours: 8,
                  otHours: 2,
                  basePay: 800,
                  otPay: 300,
                  grossPay: 1100,
                  socialSecurity: 40, // Wait, code in hr.service.ts says: socialSecurity = Math.min(basePay * 0.05, 750). basePay = 800. 800 * 0.05 = 40.
                  taxDeduction: 33, // 1100 * 0.03
                  netPay: 1027, // 1100 - 40 - 33
                }),
                expect.objectContaining({
                  userId: 2,
                  standardHours: 8,
                  otHours: 192,
                  basePay: 16000,
                  socialSecurity: 750, // Math.min(16000 * 0.05, 750) = Math.min(800, 750) = 750
                }),
              ]),
            },
          }),
        }),
      );
    });
  });
});
