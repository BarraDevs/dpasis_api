import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CarrierPersistenceModule } from './application/persistence/carrier-persistence.module';
import { ActivateCarrier } from './application/usecases/activate-carrier/activate-carrier.service';
import { CreateCarrier } from './application/usecases/create-carrier/create-carrier.service';
import { DeactivateCarrier } from './application/usecases/deactivate-carrier/deactivate-carrier.service';
import { EditCarrier } from './application/usecases/edit-carrier/edit-carrier.service';
import { FindAllCarrier } from './application/usecases/find-all-carrier/find-all-carrier.service';
import { FindCarrierById } from './application/usecases/find-carrier-by-id/find-carrier-by-id.service';
import { CarrierAdminController } from './infra/drivers/http/admin/carrier-admin.controller';

@Module({
  imports: [
    CarrierPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    CarrierAdminController,
  ],
  providers: [
    ActivateCarrier,
    CreateCarrier,
    DeactivateCarrier,
    EditCarrier,
    FindAllCarrier,
    FindCarrierById,
  ],
})
export class CarrierModule {}
