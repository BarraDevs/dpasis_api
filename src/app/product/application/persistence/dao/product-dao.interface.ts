import { ProductDto } from '../../dtos/product.dto';
import { FindAllProductQueryDto } from '../../usecases/find-all-product/dtos/find-all-product.dto';

export interface IProductDao {
  findAll(queries: FindAllProductQueryDto): Promise<[ProductDto[], number]>;
  findById(id: string): Promise<ProductDto | null>;
  findByEan(ean: string, companyId: string): Promise<ProductDto | null>;
}
