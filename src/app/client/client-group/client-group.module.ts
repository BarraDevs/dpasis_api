import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientGroupPersistenceModule } from './application/persistence/client-group-persistence.module';
import { CreateClientGroup } from './application/usecases/create-client-group/create-client-group.service';
import { DeleteClientGroup } from './application/usecases/delete-client-group/delete-client-group.service';
import { EditClientGroup } from './application/usecases/edit-client-group/edit-client-group.service';
import { FindAllClientGroup } from './application/usecases/find-all-client-group/find-all-client-group.service';
import { FindClientGroupById } from './application/usecases/find-client-group-by-id/find-client-group-by-id.service';
import { UpdateClientGroupStatus } from './application/usecases/update-client-group-status/update-client-group-status.service';
import { ClientGroupAdminController } from './infra/drivers/http/admin/client-group-admin.controller';

@Module({
  imports: [
    ClientGroupPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientGroupAdminController,
  ],
  providers: [
    CreateClientGroup,
    DeleteClientGroup,
    EditClientGroup,
    FindAllClientGroup,
    FindClientGroupById,
    UpdateClientGroupStatus,
  ],
  exports: [
    FindClientGroupById,
  ],
})
export class ClientGroupModule {}
