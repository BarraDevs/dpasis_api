import { Inject, Injectable } from '@nestjs/common';
import { ProductNotFoundError } from 'src/app/product/domain/errors/product-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { ProductDto } from '../../dtos/product.dto';
import type { IProductDao } from '../../persistence/dao/product-dao.interface';

@Injectable()
export class FindProductById {
  constructor(
    @Inject(TOKENS.ProductDao) private readonly productDao: IProductDao
  ) {}

  public async execute(id: string): Promise<ProductDto> {
    const product = await this.productDao.findById(id);
    if (!product) {
      throw new ProductNotFoundError();
    }

    return product;
  }
}
