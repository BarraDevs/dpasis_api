import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ServiceWarrantyDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/service-warranty-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ServiceWarrantyDao,
    useClass: ServiceWarrantyDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ServiceWarrantyPersistenceModule {}
