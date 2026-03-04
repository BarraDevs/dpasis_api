import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { BankDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/bank-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.BankDao,
    useClass: BankDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class BankPersistenceModule {}
