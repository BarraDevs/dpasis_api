import { Inject, Injectable } from '@nestjs/common';
import { ProductNotFoundError } from 'src/app/product/domain/errors/product-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IProductDao } from '../../persistence/dao/product-dao.interface';
import type { IProductRepository } from '../../persistence/repository/product-repository.interface';

@Injectable()
export class DeleteProduct {
  constructor(
    @Inject(TOKENS.ProductDao) private readonly productDao: IProductDao,
    @Inject(TOKENS.ProductRepository) private readonly productRepository: IProductRepository,
  ) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const product = await this.productDao.findById(id);
    if (!product) {
      throw new ProductNotFoundError();
    }

    await this.productRepository.delete(id);

    return { message: 'Produto deletado com sucesso!' };
  }
}
