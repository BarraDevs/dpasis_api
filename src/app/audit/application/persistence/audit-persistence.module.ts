import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { AuditLogDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/audit-log-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.AuditLogDao,
    useClass: AuditLogDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class AuditPersistenceModule {}
