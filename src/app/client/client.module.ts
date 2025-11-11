import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { CompanyModule } from '../company/company.module';
import { ClientPersistenceModule } from './application/persistence/client-persistence.module';
import { CreateClient } from './application/usecases/create-client/create-client.service';
import { EditClient } from './application/usecases/edit-client/edit-client.service';
import { FindAllClient } from './application/usecases/find-all-client/find-all-client.service';
import { FindClientById } from './application/usecases/find-client-by-id/find-client-by-id.service';
import { ClientController } from './infra/drivers/http/client.controller';

@Module({
  imports: [
    ClientPersistenceModule,
    AuthenticationGuardsModule,
    CompanyModule,
  ],
  controllers: [
    ClientController,
  ],
  providers: [
    CreateClient,
    EditClient,
    FindAllClient,
    FindClientById,
  ],
  exports: [],
})
export class ClientModule {}
