import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ClientOwnerDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/client-owner-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ClientOwnerDao,
    useClass: ClientOwnerDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ClientOwnerPersistenceModule {}
