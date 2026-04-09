import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { CategoryDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/category-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.CategoryDao,
    useClass: CategoryDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class CategoryPersistenceModule {}
