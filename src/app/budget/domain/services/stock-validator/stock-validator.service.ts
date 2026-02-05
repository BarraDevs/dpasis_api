import { Injectable } from '@nestjs/common';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { IProductRepository } from 'src/app/product/application/persistence/repository/product-repository.interface';
import { ProductNotFoundError } from 'src/app/product/domain/errors/product-not-found.error';
import { ProductOutOfStockError } from 'src/app/product/domain/errors/product-out-of-stock.error';
import { IServiceRepository } from 'src/app/service/application/persistence/repository/service-repository.interface';
import { ServiceNotActiveError } from 'src/app/service/domain/errors/service-not-active.error';
import { ServiceNotFoundError } from 'src/app/service/domain/errors/service-not-found.error';

export interface StockValidatorInputDto {
  itemType: BudgetItemType;
  productId: string | null;
  serviceId: string | null;
  quantity: number;
}

@Injectable()
export class StockValidator {
  public async validate(items: StockValidatorInputDto[], productRepository: IProductRepository, serviceRepository: IServiceRepository): Promise<void> {
    for (const item of items) {
      switch (item.itemType) {
        case BudgetItemType.PRODUCT:
          if (!item.productId) {
            continue;
          }

          const product = await productRepository.findById(item.productId);
          if (!product) {
            throw new ProductNotFoundError();
          }
          if (!product.hasStock(item.quantity)) {
            throw new ProductOutOfStockError(product.props.description);
          }
          break;

        case BudgetItemType.SERVICE:
          if (!item.serviceId) {
            continue;
          }

          const service = await serviceRepository.findById(item.serviceId);
          if (!service) {
            throw new ServiceNotFoundError();
          }
          if (!service.isActive()) {
            throw new ServiceNotActiveError(service.props.name);
          }
          break;
      }
    }
  }
}
