import { Module } from '@nestjs/common';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [PrismaModule, OutboxModule],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}
