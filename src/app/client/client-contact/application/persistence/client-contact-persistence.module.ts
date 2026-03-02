import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ClientContactDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/client-contact-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ClientContactDao,
    useClass: ClientContactDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ClientContactPersistenceModule {}
