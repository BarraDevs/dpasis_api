import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { CompanyModule } from '../company/company.module';
import { SupplierModule } from '../supplier/supplier.module';
import { ProductPersistenceModule } from './application/persistence/product-persistence.module';
import { CreateProduct } from './application/usecases/create-product/create-product.service';
import { DeleteProduct } from './application/usecases/delete-product/delete-product.service';
import { EditProduct } from './application/usecases/edit-product/edit-product.service';
import { FindAllProduct } from './application/usecases/find-all-product/find-all-product.service';
import { FindProductById } from './application/usecases/find-product-by-id/find-product-by-id.service';
import { ProductController } from './infra/drivers/http/product.controller';

@Module({
  imports: [
    ProductPersistenceModule,
    AuthenticationGuardsModule,
    CompanyModule,
    SupplierModule,
  ],
  controllers: [
    ProductController,
  ],
  providers: [
    CreateProduct,
    DeleteProduct,
    EditProduct,
    FindAllProduct,
    FindProductById,
  ],
  exports: [],
})
export class ProductModule {}
