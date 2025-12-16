import { Inject, Injectable } from '@nestjs/common';
import { Product } from 'src/app/product/domain/entities/product.entity';
import { ProductNotFoundError } from 'src/app/product/domain/errors/product-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IProductDao } from '../../persistence/dao/product-dao.interface';
import type { IProductRepository } from '../../persistence/repository/product-repository.interface';
import { EditProductInputDto } from './dtos/edit-product.dto';

@Injectable()
export class EditProduct {
  constructor(
    @Inject(TOKENS.ProductDao) private readonly productDao: IProductDao,
    @Inject(TOKENS.ProductRepository) private readonly productRepository: IProductRepository,
  ) {}

  public async execute(id: string, data: EditProductInputDto): Promise<SuccessMessage> {
    const productDto = await this.productDao.findById(id);
    if (!productDto) {
      throw new ProductNotFoundError();
    }

    const product = Product.load({
      ...productDto,
      ...data,
      supplierIds: data.supplierIds ?? productDto.suppliers.map(supplier => supplier.id),
      currentStock: productDto.currentStock, // ensure currentStock is not altered
      updatedAt: new Date(),
    });

    await this.productRepository.edit(product);

    return { message: 'Produto atualizado com sucesso!' };
  }
}
