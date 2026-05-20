import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { DepartmentDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/department-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.DepartmentDao,
    useClass: DepartmentDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class DepartmentPersistenceModule {}
