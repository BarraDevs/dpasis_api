import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { BudgetPersistenceModule } from '../budget/application/persistence/budget-persistence.module';
import { OrderPersistenceModule } from './application/persistence/order-persistence.module';
import { CancelOrder } from './application/usecases/cancel-order/cancel-order.service';
import { CreateOrderFromBudget } from './application/usecases/create-order-from-budget/create-order-from-budget.service';
import { DeliverOrder } from './application/usecases/deliver-order/deliver-order.service';
import { FindAllOrders } from './application/usecases/find-all-orders/find-all-orders.service';
import { FindOrderById } from './application/usecases/find-order-by-id/find-order-by-id.service';
import { InvoiceOrder } from './application/usecases/invoice-order/invoice-order.service';
import { ShipOrder } from './application/usecases/ship-order/ship-order.service';
import { StartProduction } from './application/usecases/start-production/start-production.service';
import { OrderController } from './infra/drivers/http/order.controller';

@Module({
  imports: [
    BudgetPersistenceModule,
    OrderPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    OrderController,
  ],
  providers: [
    CreateOrderFromBudget,
    FindOrderById,
    FindAllOrders,
    StartProduction,
    InvoiceOrder,
    ShipOrder,
    DeliverOrder,
    CancelOrder,
  ],
})
export class OrderModule {}
