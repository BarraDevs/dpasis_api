import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ServiceCatalogDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/service-catalog-prisma.dao';
import { ServiceCatalogRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/service-catalog-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ServiceCatalogDao,
    useClass: ServiceCatalogDaoAdapterPrisma,
  },
  {
    provide: TOKENS.ServiceCatalogRepository,
    useClass: ServiceCatalogRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ServiceCatalogPersistenceModule {}
