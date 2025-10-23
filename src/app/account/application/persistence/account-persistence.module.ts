import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { AccountPrismaAdapterDao } from '../../infra/driven/persistence/dao/prisma/account-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.AccountDao,
    useClass: AccountPrismaAdapterDao,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class AccountPersistenceModule {}
