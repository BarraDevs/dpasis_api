import { DiscountType } from '../enums/discount-type.enum';

export type ClientDiscountProps = ClientDiscountCreateProps & {
  id: number | null;
  active: boolean;
};

export type ClientDiscountCreateProps = {
  clientId: number;
  description: string;
  type: DiscountType;
  discountValue: number;
  month: number;
  year: number;
  doNotGenerateCharge: boolean;
  terminateContract: boolean;
};

export class ClientDiscount {
  private readonly _props: ClientDiscountProps;

  static _instantiate(props: ClientDiscountProps): ClientDiscount {
    return new ClientDiscount(props);
  }

  private constructor(props: ClientDiscountProps) {
    this._props = {
      id: props.id,
      clientId: props.clientId,
      description: props.description,
      type: props.type,
      discountValue: props.discountValue,
      month: props.month,
      year: props.year,
      doNotGenerateCharge: props.doNotGenerateCharge,
      terminateContract: props.terminateContract,
      active: props.active,
    };
  }

  public get props(): Readonly<ClientDiscountProps> {
    return { ...this._props };
  }
}
