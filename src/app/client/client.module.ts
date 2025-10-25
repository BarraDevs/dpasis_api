import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { ClientPersistenceModule } from './application/persistence/client-persistence.module';
import { CreateClient } from './application/usecases/create-client/create-client.service';
import { FindClientById } from './application/usecases/find-client-by-id/find-client-by-id.service';
import { ClientController } from './infra/http/client.controller';

@Module({
  imports: [
    ClientPersistenceModule,
    AccountModule,
  ],
  controllers: [
    ClientController,
  ],
  providers: [
    CreateClient,
    // DeleteClient,
    // EditClient,
    // FindAllClient,
    FindClientById,
  ],
  exports: [],
})
export class ClientModule {}
