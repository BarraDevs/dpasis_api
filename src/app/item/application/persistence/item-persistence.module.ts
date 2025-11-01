import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ItemDaoAdapterPrisma } from '../../infra/driven/persistence/item.dao';
import { ItemRepositoryAdapterPrisma } from '../../infra/driven/persistence/item.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ItemDao,
    useClass: ItemDaoAdapterPrisma,
  },
  {
    provide: TOKENS.ItemRepository,
    useClass: ItemRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ItemPersistenceModule {}
