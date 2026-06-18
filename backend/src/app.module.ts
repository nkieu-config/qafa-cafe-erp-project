import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { IngredientsModule } from './ingredients/ingredients.module';
import { OrdersModule } from './orders/orders.module';

import { AuthModule } from './auth/auth.module';
import { BranchesModule } from './branches/branches.module';
import { ProcurementModule } from './procurement/procurement.module';
import { CustomersModule } from './customers/customers.module';
import { PromotionsModule } from './promotions/promotions.module';

@Module({
  imports: [PrismaModule, ProductsModule, IngredientsModule, OrdersModule, AuthModule, BranchesModule, ProcurementModule, CustomersModule, PromotionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
