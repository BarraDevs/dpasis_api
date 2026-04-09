import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { DeliveryTermDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/delivery-term-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.DeliveryTermDao,
    useClass: DeliveryTermDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class DeliveryTermPersistenceModule {}
