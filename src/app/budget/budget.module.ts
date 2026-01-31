import { Module } from '@nestjs/common';
import { ClientModule } from '../client/client.module';
import { CompanyModule } from '../company/company.module';
import { ProductModule } from '../product/product.module';
import { SellerModule } from '../seller/seller.module';
import { ServiceModule } from '../service/service.module';
import { ShipperModule } from '../shipper/shipper.module';
import { SupplierModule } from '../supplier/supplier.module';
import { BudgetPersistenceModule } from './application/persistence/budget-persistence.module';
import { CreateBudget } from './application/usecases/create-budget/create-budget.service';
import { FindAllBudget } from './application/usecases/find-all-budget/find-all-budget.service';
import { FindBudgetById } from './application/usecases/find-budget-by-id/find-budget-by-id.service';

@Module({
  imports: [
    BudgetPersistenceModule,
    CompanyModule,
    ClientModule,
    SellerModule,
    ShipperModule,
    ProductModule,
    ServiceModule,
    SupplierModule,
  ],
  controllers: [],
  providers: [
    CreateBudget,
    FindBudgetById,
    FindAllBudget,
  ],
  exports: [
    CreateBudget,
    FindBudgetById,
    FindAllBudget,
  ],
})
export class BudgetModule {}
