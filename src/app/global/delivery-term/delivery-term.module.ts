import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { DeliveryTermPersistenceModule } from './application/persistence/delivery-term-persistence.module';
import { CreateDeliveryTerm } from './application/usecases/create-delivery-term/create-delivery-term.service';
import { DeleteDeliveryTerm } from './application/usecases/delete-delivery-term/delete-delivery-term.service';
import { EditDeliveryTerm } from './application/usecases/edit-delivery-term/edit-delivery-term.service';
import { FindAllDeliveryTerm } from './application/usecases/find-all-delivery-term/find-all-delivery-term.service';
import { FindDeliveryTermById } from './application/usecases/find-delivery-term-by-id/find-delivery-term-by-id.service';
import { UpdateDeliveryTermStatus } from './application/usecases/update-delivery-term-status/update-delivery-term-status.service';
import { DeliveryTermAdminController } from './infra/drivers/http/admin/delivery-term-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    DeliveryTermPersistenceModule,
  ],
  controllers: [
    DeliveryTermAdminController,
  ],
  providers: [
    CreateDeliveryTerm,
    DeleteDeliveryTerm,
    EditDeliveryTerm,
    FindAllDeliveryTerm,
    FindDeliveryTermById,
    UpdateDeliveryTermStatus,
  ],
  exports: [
    FindDeliveryTermById,
  ],
})
export class DeliveryTermModule {}
