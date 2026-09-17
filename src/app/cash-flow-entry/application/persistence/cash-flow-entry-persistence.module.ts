import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { CashFlowEntryDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/cash-flow-entry-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.CashFlowEntryDao,
    useClass: CashFlowEntryDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class CashFlowEntryPersistenceModule {}
