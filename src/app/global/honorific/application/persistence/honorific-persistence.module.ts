import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { HonorificDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/honorific-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.HonorificDao,
    useClass: HonorificDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class HonorificPersistenceModule {}
