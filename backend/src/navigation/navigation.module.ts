import { Module } from '@nestjs/common';
import { NavCountsController } from './nav-counts.controller';
import { NavCountsService } from './nav-counts.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NavCountsController],
  providers: [NavCountsService],
  exports: [NavCountsService],
})
export class NavigationModule {}
