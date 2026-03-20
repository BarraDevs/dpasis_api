import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceDeliveryTermPersistenceModule } from './application/persistence/service-delivery-term-persistence.module';
import { CreateServiceDeliveryTerm } from './application/usecases/create-service-delivery-term/create-service-delivery-term.service';
import { DeleteServiceDeliveryTerm } from './application/usecases/delete-service-delivery-term/delete-service-delivery-term.service';
import { EditServiceDeliveryTerm } from './application/usecases/edit-service-delivery-term/edit-service-delivery-term.service';
import { FindAllServiceDeliveryTerm } from './application/usecases/find-all-service-delivery-term/find-all-service-delivery-term.service';
import { FindServiceDeliveryTermById } from './application/usecases/find-service-delivery-term-by-id/find-service-delivery-term-by-id.service';
import { UpdateServiceDeliveryTermStatus } from './application/usecases/update-service-delivery-term-status/update-service-delivery-term-status.service';
import { ServiceDeliveryTermAdminController } from './infra/drivers/http/admin/service-delivery-term-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    ServiceDeliveryTermPersistenceModule,
  ],
  controllers: [
    ServiceDeliveryTermAdminController,
  ],
  providers: [
    CreateServiceDeliveryTerm,
    DeleteServiceDeliveryTerm,
    EditServiceDeliveryTerm,
    FindAllServiceDeliveryTerm,
    FindServiceDeliveryTermById,
    UpdateServiceDeliveryTermStatus,
  ],
  exports: [
    FindServiceDeliveryTermById,
  ],
})
export class ServiceDeliveryTermModule {}
