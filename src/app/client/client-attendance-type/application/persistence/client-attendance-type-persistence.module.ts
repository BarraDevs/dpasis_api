import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ClientAttendanceTypeDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/client-attendance-type-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ClientAttendanceTypeDao,
    useClass: ClientAttendanceTypeDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ClientAttendanceTypePersistenceModule {}
