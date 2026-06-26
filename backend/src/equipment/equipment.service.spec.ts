import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentService } from './equipment.service';
import { PrismaServiceMockProvider } from '../prisma/prisma.service.mock';

describe('EquipmentService', () => {
  let service: EquipmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EquipmentService, PrismaServiceMockProvider],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
