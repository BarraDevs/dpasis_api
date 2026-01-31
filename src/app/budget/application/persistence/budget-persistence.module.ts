import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { BudgetDaoAdapterPrisma } from '../../infra/driven/persistence/budget.dao';
import { BudgetRepositoryAdapterPrisma } from '../../infra/driven/persistence/budget.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.BudgetDao,
    useClass: BudgetDaoAdapterPrisma,
  },
  {
    provide: TOKENS.BudgetRepository,
    useClass: BudgetRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class BudgetPersistenceModule {}
