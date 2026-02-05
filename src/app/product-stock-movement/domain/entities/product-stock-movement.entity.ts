import { Product } from 'src/app/product/domain/entities/product.entity';
import { ProductOutOfStockError } from 'src/app/product/domain/errors/product-out-of-stock.error';
import { AppException } from 'src/core/filters/app.exception';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';
import { ProductStockMovementTypeEnum } from '../enums/product-stock-movement.enum';
import { QuantityMustBePositiveError } from '../errors/quantity-must-be-positive.error';
import { ValueMustBePositiveError } from '../errors/value-must-be-positive.error';

export type ProductStockMovementCreateProps = {
  productId: string;
  type: ProductStockMovementTypeEnum;
  quantity: number;
  unitPriceInCents: number; // Na Entrada = Custo; Na Saída = Preço de Venda
};

export type ProductStockMovementProps = ProductStockMovementCreateProps & {
  id: string;
  createdAt: Date;
};

export class ProductStockMovement {
  private readonly _props: ProductStockMovementProps;

  static create(props: ProductStockMovementCreateProps, product: Product): { movement: ProductStockMovement, product: Product } {
    if (props.quantity <= 0) {
      throw new QuantityMustBePositiveError();
    }
    if (props.unitPriceInCents < 0) {
      throw new ValueMustBePositiveError();
    }
    if (!Object.values(ProductStockMovementTypeEnum).includes(props.type)) {
      throw new AppException('Tipo de movimentação inválido');
    }

    const movement = new ProductStockMovement({
      id: new UUID().value,
      productId: props.productId,
      type: props.type,
      quantity: props.quantity,
      unitPriceInCents: props.unitPriceInCents,
      createdAt: UTCDate.create().value,
    });

    if (props.type === ProductStockMovementTypeEnum.INPUT) {
      product.updateStock(props.quantity);
    }
    else {
      if (!product.hasStock(props.quantity)) {
        throw new ProductOutOfStockError(product.props.description);
      }
      product.updateStock(-props.quantity);
    }

    return { movement, product };
  }

  static load(props: ProductStockMovementProps): ProductStockMovement {
    return new ProductStockMovement(props);
  }

  public get props(): Readonly<ProductStockMovementProps> {
    return { ...this._props };
  }

  constructor(props: ProductStockMovementProps) {
    this._props = {
      id: props.id,
      productId: props.productId,
      type: props.type,
      quantity: props.quantity,
      unitPriceInCents: props.unitPriceInCents,
      createdAt: UTCDate.from(props.createdAt).value,
    };
  }
}
