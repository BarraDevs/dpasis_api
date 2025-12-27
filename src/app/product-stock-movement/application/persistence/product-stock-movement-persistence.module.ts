import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ProductStockMovementRepositoryAdapterPrisma } from '../../infra/driven/persistence/product-stock-movement.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ProductStockMovementRepository,
    useClass: ProductStockMovementRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ProductStockMovementPersistenceModule {}
