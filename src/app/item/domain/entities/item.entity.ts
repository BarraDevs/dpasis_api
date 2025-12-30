import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';

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
    return new Item({
      ...props,
      id: new UUID().value,
      createdAt: UTCDate.create().value,
      updatedAt: UTCDate.create().value,
    });
  }

  static load(props: ItemProps): Item {
    return new Item(props);
  }

  public get props(): Readonly<ItemProps> {
    return { ...this._props };
  }

  private constructor(props: ItemProps) {
    const quantity = new PositiveInt(props.quantity, 'Quantidade', false);
    const unitPriceInCents = new PositiveInt(props.unitPriceInCents, 'Preço unitário', true);

    this._props = {
      id: props.id,
      createdAt: UTCDate.from(props.createdAt).value,
      updatedAt: UTCDate.from(props.updatedAt).value,
      ownerId: props.ownerId,
      description: props.description,
      serviceCode: props.serviceCode,
      quantity: quantity.value,
      unitPriceInCents: unitPriceInCents.value,
    };
  }

  public calculateSubtotal(): number {
    return this._props.quantity * this._props.unitPriceInCents;
  }
}
