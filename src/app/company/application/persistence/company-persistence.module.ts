import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { CompanyDaoAdapterPrisma } from '../../infra/driven/persistence/company.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.CompanyDao,
    useClass: CompanyDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class CompanyPersistenceModule {}
