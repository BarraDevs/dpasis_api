import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ClientItemDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/client-item-prisma.dao';
import { ClientItemRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/client-item-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ClientItemDao,
    useClass: ClientItemDaoAdapterPrisma,
  },
  {
    provide: TOKENS.ClientItemRepository,
    useClass: ClientItemRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ClientItemPersistenceModule {}
