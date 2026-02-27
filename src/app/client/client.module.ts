import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { ClientGroupModule } from '../client-group/client-group.module';
import { ClientOwnerModule } from '../client-owner/client-owner.module';
import { ClientPersistenceModule } from './application/persistence/client-persistence.module';
import { CreateClient } from './application/usecases/create-client/create-client.service';
import { DeleteClient } from './application/usecases/delete-client/delete-client.service';
import { EditClient } from './application/usecases/edit-client/edit-client.service';
import { FindAllClient } from './application/usecases/find-all-client/find-all-client.service';
import { FindClientById } from './application/usecases/find-client-by-id/find-client-by-id.service';
import { ClientAdminController } from './infra/drivers/http/admin/client-admin.controller';

@Module({
  imports: [
    ClientPersistenceModule,
    ClientGroupModule,
    ClientOwnerModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientAdminController,
  ],
  providers: [
    CreateClient,
    DeleteClient,
    EditClient,
    FindAllClient,
    FindClientById,
  ],
  exports: [
    FindClientById,
  ],
})
export class ClientModule {}
