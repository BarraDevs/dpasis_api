import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { ShipperPersistenceModule } from './application/persistence/shipper-persistence.module';
import { CreateShipper } from './application/usecases/create-shipper/create-shipper.service';
import { DeleteShipper } from './application/usecases/delete-shipper/delete-shipper.service';
import { EditShipper } from './application/usecases/edit-shipper/edit-shipper.service';
import { FindAllShipper } from './application/usecases/find-all-shipper/find-all-shipper.service';
import { FindShipperById } from './application/usecases/find-shipper-by-id/find-shipper-by-id.service';
import { ShipperController } from './infra/drivers/http/shipper.controller';

@Module({
  imports: [
    ShipperPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ShipperController,
  ],
  providers: [
    CreateShipper,
    EditShipper,
    FindAllShipper,
    FindShipperById,
    DeleteShipper,
  ],
  exports: [],
})
export class ShipperModule {}
