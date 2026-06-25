import { Module } from '@nestjs/common';
import { OutboxProcessor } from './outbox.processor';
import { OutboxService } from './outbox.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OutboxService, OutboxProcessor],
  exports: [OutboxService],
})
export class OutboxModule {}
