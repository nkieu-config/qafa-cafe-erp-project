import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ProcurementModule } from '../procurement/procurement.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [ProcurementModule, CustomersModule],
  controllers: [OrdersController],
  providers: [OrdersService]
})
export class OrdersModule {}
