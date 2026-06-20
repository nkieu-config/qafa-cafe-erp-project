import { Module } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { SuppliersController } from './suppliers.controller';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [PrismaModule, AccountingModule],
  controllers: [SuppliersController, PurchaseOrdersController],
  providers: [ProcurementService],
  exports: [ProcurementService]
})
export class ProcurementModule {}
