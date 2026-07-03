import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ProviderItemDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/provider-item-prisma.dao';
import { ProviderItemRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/provider-item-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ProviderItemDao,
    useClass: ProviderItemDaoAdapterPrisma,
  },
  {
    provide: TOKENS.ProviderItemRepository,
    useClass: ProviderItemRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ProviderItemPersistenceModule {}
