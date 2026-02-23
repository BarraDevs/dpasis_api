import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { ClientOwnerPersistenceModule } from './application/persistence/client-owner-persistence.module';
import { CreateClientOwner } from './application/usecases/create-client-owner/create-client-owner.service';
import { DeleteClientOwner } from './application/usecases/delete-client-owner/delete-client-owner.service';
import { EditClientOwner } from './application/usecases/edit-client-owner/edit-client-owner.service';
import { FindAllClientOwner } from './application/usecases/find-all-client-owner/find-all-client-owner.service';
import { FindClientOwnerById } from './application/usecases/find-client-owner-by-id/find-client-owner-by-id.service';
import { UpdateClientOwnerStatus } from './application/usecases/update-client-owner-status/update-client-owner-status.service';
import { ClientOwnerAdminController } from './infra/drivers/http/admin/client-owner-admin.controller';

@Module({
  imports: [
    ClientOwnerPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientOwnerAdminController,
  ],
  providers: [
    CreateClientOwner,
    DeleteClientOwner,
    EditClientOwner,
    FindAllClientOwner,
    FindClientOwnerById,
    UpdateClientOwnerStatus,
  ],
})
export class ClientOwnerModule {}
