import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { OwnerModule } from '../owner/owner.module';
import { AddressPersistenceModule } from './application/persistence/address-persistence.module';
import { CreateAddress } from './application/usecases/create-address/create-address.service';
import { DeleteAddress } from './application/usecases/delete-address/delete-address.service';
import { EditAddress } from './application/usecases/edit-address/edit-address.service';
import { FindAddressById } from './application/usecases/find-address-by-id/find-address-by-id.service';
import { FindAllAddress } from './application/usecases/find-all-address/find-all-address.service';
import { FindMainAddress } from './application/usecases/find-main-address/find-main-address.service';
import { AddressMainController } from './infra/drivers/http/main-address/main-address.controller';
import { AddressSecondaryController } from './infra/drivers/http/secondary-address/secondary-address.controller';

@Module({
  imports: [
    AddressPersistenceModule,
    AuthenticationGuardsModule,
    OwnerModule,
  ],
  controllers: [
    AddressMainController,
    AddressSecondaryController,
  ],
  providers: [
    CreateAddress,
    DeleteAddress,
    EditAddress,
    FindAllAddress,
    FindAddressById,
    FindMainAddress,
  ],
  exports: [],
})
export class AddressModule {}
