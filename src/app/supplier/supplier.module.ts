import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { CompanyModule } from '../company/company.module';
import { SupplierPersistenceModule } from './application/persistence/supplier-persistence.module';
import { CreateSupplier } from './application/usecases/create-supplier/create-supplier.service';
import { EditSupplier } from './application/usecases/edit-supplier/edit-supplier.service';
import { FindAllSupplier } from './application/usecases/find-all-supplier/find-all-supplier.service';
import { FindSupplierById } from './application/usecases/find-supplier-by-id/find-supplier-by-id.service';
import { UpdateSupplierStatus } from './application/usecases/update-supplier-status/update-supplier-status.service';
import { SupplierController } from './infra/drivers/http/supplier.controller';

@Module({
  imports: [
    SupplierPersistenceModule,
    AuthenticationGuardsModule,
    CompanyModule,
  ],
  controllers: [
    SupplierController,
  ],
  providers: [
    CreateSupplier,
    EditSupplier,
    FindAllSupplier,
    FindSupplierById,
    UpdateSupplierStatus,
  ],
  exports: [
    FindSupplierById,
  ],
})
export class SupplierModule {}
