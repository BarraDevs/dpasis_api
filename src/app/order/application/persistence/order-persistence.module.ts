import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { OrderDaoAdapterPrisma } from '../../infra/driven/persistence/order.dao';
import { OrderRepositoryAdapterPrisma } from '../../infra/driven/persistence/order.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.OrderDao,
    useClass: OrderDaoAdapterPrisma,
  },
  {
    provide: TOKENS.OrderRepository,
    useClass: OrderRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class OrderPersistenceModule {}
