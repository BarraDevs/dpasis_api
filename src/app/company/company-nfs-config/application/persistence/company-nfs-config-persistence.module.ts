import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { CompanyNfsConfigDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/company-nfs-config-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.CompanyNfsConfigDao,
    useClass: CompanyNfsConfigDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class CompanyNfsConfigPersistenceModule {}
