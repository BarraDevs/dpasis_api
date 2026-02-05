import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { ClientModule } from '../client/client.module';
import { CompanyModule } from '../company/company.module';
import { ProductPersistenceModule } from '../product/application/persistence/product-persistence.module';
import { ProductModule } from '../product/product.module';
import { SellerModule } from '../seller/seller.module';
import { ServicePersistenceModule } from '../service/application/persistence/service-persistence.module';
import { ServiceModule } from '../service/service.module';
import { ShipperModule } from '../shipper/shipper.module';
import { SupplierModule } from '../supplier/supplier.module';
import { BudgetPersistenceModule } from './application/persistence/budget-persistence.module';
import { ApproveBudget } from './application/usecases/approve-budget/approve-budget.service';
import { CancelBudget } from './application/usecases/cancel-budget/cancel-budget.service';
import { CreateBudget } from './application/usecases/create-budget/create-budget.service';
import { DeleteBudget } from './application/usecases/delete-budget/delete-budget.service';
import { EditBudget } from './application/usecases/edit-budget/edit-budget.service';
import { FindAllBudget } from './application/usecases/find-all-budget/find-all-budget.service';
import { FindBudgetById } from './application/usecases/find-budget-by-id/find-budget-by-id.service';
import { RejectBudget } from './application/usecases/reject-budget/reject-budget.service';
import { StockValidator } from './domain/services/stock-validator/stock-validator.service';
import { BudgetController } from './infra/drivers/http/budget.controller';

@Module({
  imports: [
    BudgetPersistenceModule,
    ProductPersistenceModule,
    ServicePersistenceModule,
    AuthenticationGuardsModule,
    CompanyModule,
    ClientModule,
    SellerModule,
    ShipperModule,
    ProductModule,
    ServiceModule,
    SupplierModule,
  ],
  controllers: [BudgetController],
  providers: [
    CreateBudget,
    FindBudgetById,
    FindAllBudget,
    EditBudget,
    DeleteBudget,
    CancelBudget,
    ApproveBudget,
    RejectBudget,
    StockValidator,
  ],
})
export class BudgetModule {}
