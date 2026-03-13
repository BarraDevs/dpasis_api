import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ClientSystemTypeDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/client-system-type-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ClientSystemTypeDao,
    useClass: ClientSystemTypeDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ClientSystemTypePersistenceModule {}
