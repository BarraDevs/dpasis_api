import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../../authentication/application/guards/guards.module';
import { ClientModule } from '../client/client.module';
import { ClientAddressPersistenceModule } from './application/persistence/client-address-persistence.module';
import { ActivateClientAddress } from './application/usecases/activate-client-address/activate-client-address.service';
import { CreateClientAddress } from './application/usecases/create-client-address/create-client-address.service';
import { DeactivateClientAddress } from './application/usecases/deactivate-client-address/deactivate-client-address.service';
import { DeleteClientAddress } from './application/usecases/delete-client-address/delete-client-address.service';
import { EditClientAddress } from './application/usecases/edit-client-address/edit-client-address.service';
import { FindAllClientAddress } from './application/usecases/find-all-client-address/find-all-client-address.service';
import { FindClientAddressByIdAndClientId } from './application/usecases/find-client-address-by-id-and-client-id/find-client-address-by-id-and-client-id.service';
import { FindClientAddressById } from './application/usecases/find-client-address-by-id/find-client-address-by-id.service';
import { ClientAddressAdminController } from './infra/drivers/http/client-address-admin.controller';

@Module({
  imports: [
    ClientAddressPersistenceModule,
    ClientModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientAddressAdminController,
  ],
  providers: [
    CreateClientAddress,
    DeleteClientAddress,
    EditClientAddress,
    FindAllClientAddress,
    FindClientAddressById,
    FindClientAddressByIdAndClientId,
    ActivateClientAddress,
    DeactivateClientAddress,
  ],
  exports: [
    FindClientAddressById,
    FindClientAddressByIdAndClientId,
  ],
})
export class ClientAddressModule {}
