import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ServiceBilledDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/service-billed-prisma.dao';
import { ServiceBilledRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/service-billed-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ServiceBilledDao,
    useClass: ServiceBilledDaoAdapterPrisma,
  },
  {
    provide: TOKENS.ServiceBilledRepository,
    useClass: ServiceBilledRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ServiceBilledPersistenceModule {}
