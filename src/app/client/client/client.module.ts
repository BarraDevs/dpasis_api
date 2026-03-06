import { Module } from '@nestjs/common';
import { CompanyModule } from 'src/app/company/company.module';
import { AuthenticationGuardsModule } from '../../authentication/application/guards/guards.module';
import { ClientGroupModule } from '../client-group/client-group.module';
import { ClientOwnerModule } from '../client-owner/client-owner.module';
import { ClientPersistenceModule } from './application/persistence/client-persistence.module';
import { ActivateClient } from './application/usecases/activate-client/activate-client.service';
import { CreateClient } from './application/usecases/create-client/create-client.service';
import { DeactivateClient } from './application/usecases/deactivate-client/deactivate-client.service';
import { EditClient } from './application/usecases/edit-client/edit-client.service';
import { FindAllClient } from './application/usecases/find-all-client/find-all-client.service';
import { FindClientById } from './application/usecases/find-client-by-id/find-client-by-id.service';
import { ClientAdminController } from './infra/drivers/http/admin/client-admin.controller';

@Module({
  imports: [
    ClientPersistenceModule,
    ClientGroupModule,
    ClientOwnerModule,
    CompanyModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientAdminController,
  ],
  providers: [
    ActivateClient,
    CreateClient,
    DeactivateClient,
    EditClient,
    FindAllClient,
    FindClientById,
  ],
  exports: [
    FindClientById,
  ],
})
export class ClientModule {}
