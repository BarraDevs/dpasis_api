import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceBilledPersistenceModule } from './application/persistence/service-billed-persistence.module';
import { ActivateServiceBilled } from './application/usecases/activate-service-billed/activate-service-billed.service';
import { CreateServiceBilled } from './application/usecases/create-service-billed/create-service-billed.service';
import { DeactivateServiceBilled } from './application/usecases/deactivate-service-billed/deactivate-service-billed.service';
import { DeleteServiceBilled } from './application/usecases/delete-service-billed/delete-service-billed.service';
import { EditServiceBilled } from './application/usecases/edit-service-billed/edit-service-billed.service';
import { FindAllServiceBilled } from './application/usecases/find-all-service-billed/find-all-service-billed.service';
import { FindServiceBilledById } from './application/usecases/find-service-billed-by-id/find-service-billed-by-id.service';
import { ServiceBilledAdminController } from './infra/drivers/http/admin/service-billed-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    ServiceBilledPersistenceModule,
  ],
  controllers: [
    ServiceBilledAdminController,
  ],
  providers: [
    ActivateServiceBilled,
    CreateServiceBilled,
    DeactivateServiceBilled,
    DeleteServiceBilled,
    EditServiceBilled,
    FindAllServiceBilled,
    FindServiceBilledById,
  ],
  exports: [
    FindServiceBilledById,
  ],
})
export class ServiceBilledModule {}
