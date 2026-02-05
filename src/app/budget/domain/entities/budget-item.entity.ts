import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';
import { BudgetItemType } from '../../enums/budget-item-type.enum';
import { InvalidItemTypeError } from '../errors/invalid-item-type.error';
import { ItemMustHaveProductOrServiceError } from '../errors/item-must-have-product-or-service.error';

export type BudgetItemProps = BudgetItemCreateProps & {
  id: string;
  subtotalInCents: number;
  createdAt: Date;
  updatedAt: Date;
};

export type BudgetItemCreateProps = {
  itemType: BudgetItemType;
  productId: string | null;
  serviceId: string | null;
  description: string;
  quantity: number;
  unitPriceInCents: number;
  discountInCents: number;
};

export class BudgetItem {
  private readonly _props: BudgetItemProps;

  private static calculateSubtotal(quantity: number, unitPriceInCents: number, discountInCents: number): number {
    return (quantity * unitPriceInCents) - discountInCents;
  }

  public static create(props: BudgetItemCreateProps): BudgetItem {
    const subtotal = BudgetItem.calculateSubtotal(props.quantity, props.unitPriceInCents, props.discountInCents);

    return new BudgetItem({
      ...props,
      id: new UUID().value,
      subtotalInCents: subtotal,
      createdAt: UTCDate.create().value,
      updatedAt: UTCDate.create().value,
    });
  }

  public static load(props: BudgetItemProps): BudgetItem {
    return new BudgetItem(props);
  }

  private validateItemType(itemType: BudgetItemType): void {
    if (itemType !== BudgetItemType.PRODUCT && itemType !== BudgetItemType.SERVICE) {
      throw new InvalidItemTypeError();
    }
  }

  private validateProductOrService(itemType: BudgetItemType, productId: string | null, serviceId: string | null): void {
    const hasProduct = productId !== null;
    const hasService = serviceId !== null;

    if (itemType === BudgetItemType.PRODUCT && (!hasProduct || hasService)) {
      throw new ItemMustHaveProductOrServiceError();
    }

    if (itemType === BudgetItemType.SERVICE && (!hasService || hasProduct)) {
      throw new ItemMustHaveProductOrServiceError();
    }
  }

  private constructor(props: BudgetItemProps) {
    this.validateItemType(props.itemType);
    this.validateProductOrService(props.itemType, props.productId, props.serviceId);

    this._props = {
      id: props.id,
      itemType: props.itemType,
      productId: props.productId,
      serviceId: props.serviceId,
      description: props.description,
      quantity: new PositiveInt(props.quantity, 'Quantidade', false).value,
      unitPriceInCents: new PositiveInt(props.unitPriceInCents, 'Preço unitário', true).value,
      discountInCents: new PositiveInt(props.discountInCents, 'Desconto', true).value,
      subtotalInCents: new PositiveInt(props.subtotalInCents, 'Subtotal do item', true).value,
      createdAt: UTCDate.from(props.createdAt).value,
      updatedAt: UTCDate.from(props.updatedAt).value,
    };
  }

  public get props(): Readonly<BudgetItemProps> {
    return { ...this._props };
  }

  public isProduct(): boolean {
    return this._props.itemType === BudgetItemType.PRODUCT;
  }

  public isService(): boolean {
    return this._props.itemType === BudgetItemType.SERVICE;
  }

  public update(updates: Partial<BudgetItemCreateProps>): BudgetItem {
    const updatedProps = {
      ...this._props,
      ...updates,
      id: this._props.id,
      createdAt: this._props.createdAt,
      updatedAt: UTCDate.create().value,
    };

    this.validateItemType(updatedProps.itemType);
    this.validateProductOrService(updatedProps.itemType, updatedProps.productId, updatedProps.serviceId);

    updatedProps.subtotalInCents = BudgetItem.calculateSubtotal(
      updatedProps.quantity,
      updatedProps.unitPriceInCents,
      updatedProps.discountInCents,
    );

    return new BudgetItem(updatedProps);
  }
}
