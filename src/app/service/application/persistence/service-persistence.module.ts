import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ServiceDaoAdapterPrisma } from '../../infra/driven/persistence/service.dao';
import { ServiceRepositoryAdapterPrisma } from '../../infra/driven/persistence/service.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ServiceDao,
    useClass: ServiceDaoAdapterPrisma,
  },
  {
    provide: TOKENS.ServiceRepository,
    useClass: ServiceRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ServicePersistenceModule {}
