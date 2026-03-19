import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ServiceCategoryDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/service-category-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ServiceCategoryDao,
    useClass: ServiceCategoryDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ServiceCategoryPersistenceModule {}
