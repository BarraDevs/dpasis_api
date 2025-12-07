import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';

type ItemProps = ItemCreateProps & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

type ItemCreateProps = {
  ownerId: string;
  description: string;
  serviceCode: string;
  quantity: number;
  unitPriceInCents: number;
};

export class Item {
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
    return { ...this._props };
  }

  private constructor(props: ItemProps) {
    this._props = {
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      ownerId: props.ownerId,
      description: props.description,
      serviceCode: props.serviceCode,
      quantity: props.quantity,
      unitPriceInCents: props.unitPriceInCents,
    };
  }

  public calculateSubtotal(): number {
    return this._props.quantity * this._props.unitPriceInCents;
  }
}
