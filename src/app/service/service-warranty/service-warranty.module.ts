import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceWarrantyPersistenceModule } from './application/persistence/service-warranty-persistence.module';
import { CreateServiceWarranty } from './application/usecases/create-service-warranty/create-service-warranty.service';
import { DeleteServiceWarranty } from './application/usecases/delete-service-warranty/delete-service-warranty.service';
import { EditServiceWarranty } from './application/usecases/edit-service-warranty/edit-service-warranty.service';
import { FindAllServiceWarranty } from './application/usecases/find-all-service-warranty/find-all-service-warranty.service';
import { FindServiceWarrantyById } from './application/usecases/find-service-warranty-by-id/find-service-warranty-by-id.service';
import { UpdateServiceWarrantyStatus } from './application/usecases/update-service-warranty-status/update-service-warranty-status.service';
import { ServiceWarrantyAdminController } from './infra/drivers/http/admin/service-warranty-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    ServiceWarrantyPersistenceModule,
  ],
  controllers: [
    ServiceWarrantyAdminController,
  ],
  providers: [
    CreateServiceWarranty,
    DeleteServiceWarranty,
    EditServiceWarranty,
    FindAllServiceWarranty,
    FindServiceWarrantyById,
    UpdateServiceWarrantyStatus,
  ],
  exports: [
    FindServiceWarrantyById,
  ],
})
export class ServiceWarrantyModule {}
