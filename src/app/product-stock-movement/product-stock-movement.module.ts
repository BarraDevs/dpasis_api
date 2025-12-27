import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { ProductPersistenceModule } from '../product/application/persistence/product-persistence.module';
import { ProductStockMovementPersistenceModule } from './application/persistence/product-stock-movement-persistence.module';
import { CreateProductStockMovement } from './application/usecases/create-product-stock-movement/create-product-stock-movement.service';
import { ProductStockMovementController } from './infra/drivers/http/product-stock-movement.controller';

@Module({
  imports: [
    ProductStockMovementPersistenceModule,
    ProductPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ProductStockMovementController,
  ],
  providers: [
    CreateProductStockMovement,
  ],
  exports: [
    CreateProductStockMovement,
  ],
})
export class ProductStockMovementModule {}
