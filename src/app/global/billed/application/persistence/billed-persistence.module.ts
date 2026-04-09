import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { BilledDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/billed-prisma.dao';
import { BilledRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/billed-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.BilledDao,
    useClass: BilledDaoAdapterPrisma,
  },
  {
    provide: TOKENS.BilledRepository,
    useClass: BilledRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class BilledPersistenceModule {}
