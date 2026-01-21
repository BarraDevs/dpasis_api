import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ServiceRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/service.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ServiceRepository,
    useClass: ServiceRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ServicePersistenceModule {}
