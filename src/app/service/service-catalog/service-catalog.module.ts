import { Module } from '@nestjs/common';
import { CompanyModule } from 'src/app/company/company.module';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceBilledModule } from 'src/app/service/service-billed/service-billed.module';
import { ServiceCategoryModule } from 'src/app/service/service-category/service-category.module';
import { ServiceDeliveryTermModule } from 'src/app/service/service-delivery-term/service-delivery-term.module';
import { ServiceFreightModule } from 'src/app/service/service-freight/service-freight.module';
import { ServiceProposalValidityModule } from 'src/app/service/service-proposal-validity/service-proposal-validity.module';
import { ServiceWarrantyModule } from 'src/app/service/service-warranty/service-warranty.module';
import { CnaeNbsIndopModule } from 'src/app/taxation/cnae-nbs-indop/cnae-nbs-indop.module';
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
    ServiceBilledModule,
    ServiceCategoryModule,
    ServiceDeliveryTermModule,
    ServiceFreightModule,
    ServiceProposalValidityModule,
    ServiceWarrantyModule,
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
