import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { CompanyDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/company-prisma.dao';
import { CompanyRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/company-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.CompanyDao,
    useClass: CompanyDaoAdapterPrisma,
  },
  {
    provide: TOKENS.CompanyRepository,
    useClass: CompanyRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class CompanyPersistenceModule {}
