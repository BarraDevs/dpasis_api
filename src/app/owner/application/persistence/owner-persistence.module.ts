import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { OwnerDaoAdapterPrisma } from '../../infra/driven/persistence/owner.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.OwnerDao,
    useClass: OwnerDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class OwnerPersistenceModule {}
