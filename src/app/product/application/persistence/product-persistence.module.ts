import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ProductDaoAdapterPrisma } from '../../infra/driven/persistence/product.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ProductDao,
    useClass: ProductDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ProductPersistenceModule {}
