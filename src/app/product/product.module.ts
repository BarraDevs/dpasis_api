import { Module } from '@nestjs/common';
import { ProductPersistenceModule } from './application/persistence/product-persistence.module';
import { ProductController } from './infra/drivers/http/product.controller';

@Module({
  imports: [
    ProductPersistenceModule,
  ],
  controllers: [
    ProductController,
  ],
  providers: [
    // CreateProduct,
    // DeleteProduct,
    // EditProduct,
    // FindAllProduct,
    // FindProductById,
  ],
  exports: [],
})
export class ProductModule {}
