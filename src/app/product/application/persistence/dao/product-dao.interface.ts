import { ProductDto } from '../../dtos/product.dto';
import { CreateProductInputDto } from '../../usecases/create-product/dtos/create-product.dto';
import { EditProductInputDto } from '../../usecases/edit-product/dtos/edit-product.dto';
import { FindAllProductQueryDto } from '../../usecases/find-all-product/dtos/find-all-product.dto';

export interface IProductDao {
  findAll(queries: FindAllProductQueryDto): Promise<[ProductDto[], number]>;
  findById(id: string): Promise<ProductDto | null>;
  save(data: CreateProductInputDto): Promise<string>;
  edit(id: string, data: EditProductInputDto): Promise<void>;
  delete(id: string): Promise<void>;
}
