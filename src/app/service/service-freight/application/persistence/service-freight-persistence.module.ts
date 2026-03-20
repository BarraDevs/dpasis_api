import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ServiceFreightDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/service-freight-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ServiceFreightDao,
    useClass: ServiceFreightDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ServiceFreightPersistenceModule {}
