import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ServiceDeliveryTermDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/service-delivery-term-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ServiceDeliveryTermDao,
    useClass: ServiceDeliveryTermDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ServiceDeliveryTermPersistenceModule {}
