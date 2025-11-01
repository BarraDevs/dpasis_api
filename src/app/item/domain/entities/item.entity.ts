import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';

type ItemCreateProps = {
  ownerId: string;
  description: string;
  serviceCode: string;
  quantity: number;
  unitPriceInCents: number;
};

type ItemProps = ItemCreateProps & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export class Item {
  private readonly _id: string;
  private readonly _props: ItemProps;

  static create(props: ItemCreateProps): Item {
    const quantity = new PositiveInt(props.quantity, 'Quantidade');
    const unitPriceInCents = new PositiveInt(props.unitPriceInCents, 'Preço unitário');

    return new Item({
      ...props,
      id: crypto.randomUUID(),
      quantity: quantity.value,
      unitPriceInCents: unitPriceInCents.value,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static load(props: ItemProps): Item {
    return new Item(props);
  }

  public get props(): Readonly<ItemProps> {
    return { ...this._props, id: this._id };
  }

  private constructor(props: ItemProps) {
    this._id = props.id;
    this._props = props;
  }

  public calculateSubtotal(): number {
    return this._props.quantity * this._props.unitPriceInCents;
  }

  public changePrice(newPriceInCents?: number) {
    if (!newPriceInCents) return;

    const unitPriceInCents = new PositiveInt(newPriceInCents, 'Preço unitário');
    this._props.unitPriceInCents = unitPriceInCents.value;
    this._props.updatedAt = new Date();
  }
}
