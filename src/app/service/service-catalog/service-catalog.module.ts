import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CompanyModule } from 'src/app/company/company/company.module';
import { BilledModule } from 'src/app/global/billed/billed.module';
import { CategoryModule } from 'src/app/global/category/category.module';
import { DeliveryTermModule } from 'src/app/global/delivery-term/delivery-term.module';
import { FreightModule } from 'src/app/global/freight/freight.module';
import { ProposalValidityModule } from 'src/app/global/proposal-validity/proposal-validity.module';
import { CnaeNbsIndopModule } from 'src/app/global/taxation/cnae-nbs-indop/cnae-nbs-indop.module';
import { WarrantyModule } from 'src/app/global/warranty/warranty.module';
import { ServiceCatalogPersistenceModule } from './application/persistence/service-catalog-persistence.module';
import { ActivateServiceCatalog } from './application/usecases/activate-service-catalog/activate-service-catalog.service';
import { CreateServiceCatalog } from './application/usecases/create-service-catalog/create-service-catalog.service';
import { DeactivateServiceCatalog } from './application/usecases/deactivate-service-catalog/deactivate-service-catalog.service';
import { DeleteServiceCatalog } from './application/usecases/delete-service-catalog/delete-service-catalog.service';
import { EditServiceCatalog } from './application/usecases/edit-service-catalog/edit-service-catalog.service';
import { FindAllServiceCatalog } from './application/usecases/find-all-service-catalog/find-all-service-catalog.service';
import { FindServiceCatalogById } from './application/usecases/find-service-catalog-by-id/find-service-catalog-by-id.service';
import { ServiceCatalogAdminController } from './infra/drivers/http/admin/service-catalog-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    CompanyModule,
    ServiceCatalogPersistenceModule,
    BilledModule,
    CategoryModule,
    DeliveryTermModule,
    FreightModule,
    ProposalValidityModule,
    WarrantyModule,
    CnaeNbsIndopModule,
  ],
  controllers: [
    ServiceCatalogAdminController,
  ],
  providers: [
    ActivateServiceCatalog,
    CreateServiceCatalog,
    DeactivateServiceCatalog,
    DeleteServiceCatalog,
    EditServiceCatalog,
    FindAllServiceCatalog,
    FindServiceCatalogById,
  ],
  exports: [
    FindServiceCatalogById,
  ],
})
export class ServiceCatalogModule {}
