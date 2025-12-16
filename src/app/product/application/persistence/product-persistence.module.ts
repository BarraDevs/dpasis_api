import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ProductDaoAdapterPrisma } from '../../infra/driven/persistence/product.dao';
import { ProductRepositoryAdapterPrisma } from '../../infra/driven/persistence/product.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ProductDao,
    useClass: ProductDaoAdapterPrisma,
  },
  {
    provide: TOKENS.ProductRepository,
    useClass: ProductRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ProductPersistenceModule {}
