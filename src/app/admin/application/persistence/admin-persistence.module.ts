import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { AdminDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/admin-prisma.dao';
import { AdminRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/admin-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.AdminDao,
    useClass: AdminDaoAdapterPrisma,
  },
  {
    provide: TOKENS.AdminRepository,
    useClass: AdminRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class AdminPersistenceModule {}
