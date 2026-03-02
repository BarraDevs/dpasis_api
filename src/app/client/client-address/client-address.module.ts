import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../../authentication/application/guards/guards.module';
import { ClientAddressPersistenceModule } from './application/persistence/client-address-persistence.module';
import { CreateClientAddress } from './application/usecases/create-client-address/create-client-address.service';
import { DeleteClientAddress } from './application/usecases/delete-client-address/delete-client-address.service';
import { EditClientAddress } from './application/usecases/edit-client-address/edit-client-address.service';
import { FindAllClientAddress } from './application/usecases/find-all-client-address/find-all-client-address.service';
import { FindClientAddressById } from './application/usecases/find-client-address-by-id/find-client-address-by-id.service';
import { ClientAddressAdminController } from './infra/drivers/http/client-address-admin.controller';

@Module({
  imports: [
    ClientAddressPersistenceModule,
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
  ],
  exports: [],
})
export class ClientAddressModule {}
