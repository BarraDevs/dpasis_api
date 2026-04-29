import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ResaleDepartmentDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/resale-department-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ResaleDepartmentDao,
    useClass: ResaleDepartmentDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ResaleDepartmentPersistenceModule {}
