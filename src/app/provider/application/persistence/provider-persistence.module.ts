import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ProviderDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/provider.dao';
import { ProviderRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/provider.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ProviderDao,
    useClass: ProviderDaoAdapterPrisma,
  },
  {
    provide: TOKENS.ProviderRepository,
    useClass: ProviderRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ProviderPersistenceModule {}
