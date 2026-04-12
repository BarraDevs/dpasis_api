import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ClientDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/client-prisma.dao';
import { ClientRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/client-prisma.repository';
import { ClientSequenceRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/client-sequence-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ClientDao,
    useClass: ClientDaoAdapterPrisma,
  },
  {
    provide: TOKENS.ClientRepository,
    useClass: ClientRepositoryAdapterPrisma,
  },
  {
    provide: TOKENS.ClientSequenceRepository,
    useClass: ClientSequenceRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ClientPersistenceModule {}
