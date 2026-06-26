import { Test, TestingModule } from '@nestjs/testing';
import { AccountingService } from './accounting.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('AccountingService', () => {
  let service: AccountingService;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createJournalEntry', () => {
    const mockAccounts = [
      { id: 1, code: '1010', name: 'Cash', type: 'ASSET' },
      { id: 2, code: '4010', name: 'Sales Revenue', type: 'REVENUE' },
    ];

    it('should throw BadRequestException if debits and credits do not balance', async () => {
      const entryData = {
        description: 'Unbalanced Entry',
        lines: [
          { accountCode: '1010', debit: 100, credit: 0 },
          { accountCode: '4010', debit: 0, credit: 90 }, // Unbalanced!
        ],
      };

      await expect(service.createJournalEntry(entryData)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createJournalEntry(entryData)).rejects.toThrow(
        'Journal entry unbalanced',
      );

      expect(prismaMock.account.findMany).not.toHaveBeenCalled();
      expect(prismaMock.journalEntry.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if account codes are invalid', async () => {
      const entryData = {
        description: 'Invalid Accounts',
        lines: [
          { accountCode: '1010', debit: 100, credit: 0 },
          { accountCode: '9999', debit: 0, credit: 100 }, // 9999 does not exist
        ],
      };

      // Mock DB returning only 1 account
      prismaMock.account.findMany.mockResolvedValue([mockAccounts[0]] as any);

      await expect(service.createJournalEntry(entryData)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createJournalEntry(entryData)).rejects.toThrow(
        'One or more account codes are invalid',
      );

      expect(prismaMock.journalEntry.create).not.toHaveBeenCalled();
    });

    it('should create journal entry successfully when balanced and accounts are valid', async () => {
      const entryData = {
        branchId: 1,
        reference: 'TEST-001',
        description: 'Valid Entry',
        lines: [
          { accountCode: '1010', debit: 100, credit: 0 },
          { accountCode: '4010', debit: 0, credit: 100 },
        ],
      };

      prismaMock.account.findMany.mockResolvedValue(mockAccounts as any);

      const createdEntry = {
        id: 1,
        ...entryData,
        status: 'POSTED',
        date: new Date(),
      };

      prismaMock.journalEntry.create.mockResolvedValue(createdEntry as any);

      const result = await service.createJournalEntry(entryData);

      expect(result).toEqual(createdEntry);
      expect(prismaMock.account.findMany).toHaveBeenCalledWith({
        where: { code: { in: ['1010', '4010'] } },
      });
      expect(prismaMock.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'POSTED',
            lines: {
              create: [
                { accountId: 1, debit: 100, credit: 0, description: undefined },
                { accountId: 2, debit: 0, credit: 100, description: undefined },
              ],
            },
          }),
        }),
      );
    });
  });

  describe('handleOrderCreated', () => {
    it('uses the payment clearing account for card sales', async () => {
      const createSpy = jest
        .spyOn(service, 'createJournalEntry')
        .mockResolvedValue({ id: 1 } as any);

      await service.handleOrderCreated({
        order: {
          id: 42,
          branchId: 1,
          netAmount: 150,
          totalCogs: 30,
          paymentMethod: 'CREDIT_CARD',
        },
      } as any);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          lines: expect.arrayContaining([
            expect.objectContaining({
              accountCode: '1040',
              debit: 150,
              description: 'Card payment received',
            }),
          ]),
        }),
      );

      createSpy.mockRestore();
    });
  });
});
