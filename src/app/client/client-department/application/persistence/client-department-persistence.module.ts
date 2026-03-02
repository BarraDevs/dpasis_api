import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ClientDepartmentDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/client-department-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ClientDepartmentDao,
    useClass: ClientDepartmentDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ClientDepartmentPersistenceModule {}
