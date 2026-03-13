import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ClientTypeDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/client-type-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ClientTypeDao,
    useClass: ClientTypeDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ClientTypePersistenceModule {}
