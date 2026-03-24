import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ServiceAttendanceValueDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/service-attendance-value-prisma.dao';
import { ServiceAttendanceValueRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/service-attendance-value-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ServiceAttendanceValueDao,
    useClass: ServiceAttendanceValueDaoAdapterPrisma,
  },
  {
    provide: TOKENS.ServiceAttendanceValueRepository,
    useClass: ServiceAttendanceValueRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ServiceAttendanceValuePersistenceModule {}
