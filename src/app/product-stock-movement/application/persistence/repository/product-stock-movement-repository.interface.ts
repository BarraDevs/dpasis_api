import { ProductStockMovement } from 'src/app/product-stock-movement/domain/entities/product-stock-movement.entity';
import { Product } from 'src/app/product/domain/entities/product.entity';

export interface IProductStockMovementRepository {
  createMovementAndUpdateProduct(movement: ProductStockMovement, product: Product): Promise<void>;
}
