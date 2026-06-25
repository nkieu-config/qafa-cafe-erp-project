import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { IngredientsModule } from './ingredients/ingredients.module';
import { OrdersModule } from './orders/orders.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AuthModule } from './auth/auth.module';
import { BranchesModule } from './branches/branches.module';
import { ProcurementModule } from './procurement/procurement.module';
import { CustomersModule } from './customers/customers.module';
import { PromotionsModule } from './promotions/promotions.module';
import { HrModule } from './hr/hr.module';
import { FinanceModule } from './finance/finance.module';
import { InventoryModule } from './inventory/inventory.module';
import { EventsModule } from './events/events.module';
import { EquipmentModule } from './equipment/equipment.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { AccountingModule } from './accounting/accounting.module';
import { ProductionModule } from './production/production.module';
import { SettingsModule } from './settings/settings.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
    EventEmitterModule.forRoot(),
    PrismaModule, ProductsModule, IngredientsModule, OrdersModule, AuthModule, BranchesModule, ProcurementModule, CustomersModule, PromotionsModule, HrModule, FinanceModule, InventoryModule, EventsModule, EquipmentModule, ScheduleModule.forRoot(), ReportsModule, AuditModule, AccountingModule, ProductionModule, SettingsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
