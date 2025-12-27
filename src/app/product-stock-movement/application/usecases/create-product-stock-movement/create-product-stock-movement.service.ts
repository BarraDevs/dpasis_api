import { Inject, Injectable } from '@nestjs/common';
import { ProductStockMovement } from 'src/app/product-stock-movement/domain/entities/product-stock-movement.entity';
import type { IProductRepository } from 'src/app/product/application/persistence/repository/product-repository.interface';
import { ProductNotFoundError } from 'src/app/product/domain/errors/product-not-found.error';
import { TOKENS } from 'src/core/di/token';
import type { IProductStockMovementRepository } from '../../persistence/repository/product-stock-movement-repository.interface';
import { CreateProductStockMovementInputDto, CreateProductStockMovementOutputDto } from './dtos/create-product-stock-movement.dto';

@Injectable()
export class CreateProductStockMovement {
  constructor(
    @Inject(TOKENS.ProductStockMovementRepository) private readonly stockMovementRepo: IProductStockMovementRepository,
    @Inject(TOKENS.ProductRepository) private readonly productRepository: IProductRepository,
  ) {}

  public async execute(data: CreateProductStockMovementInputDto): Promise<CreateProductStockMovementOutputDto> {
    const product = await this.productRepository.findById(data.productId);
    if (!product) {
      throw new ProductNotFoundError();
    }

    const { movement, product: updatedProduct } = ProductStockMovement.create(
      {
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        unitPriceInCents: data.unitPriceInCents,
      },
      product,
    );

    await this.stockMovementRepo.createMovementAndUpdateProduct(movement, updatedProduct);

    return { id: movement.props.id };
  }
}
