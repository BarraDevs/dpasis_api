import { Product } from 'src/app/product/domain/entities/product.entity';

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  save(product: Product): Promise<void>;
  edit(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}
