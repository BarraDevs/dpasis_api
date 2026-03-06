import { DiscountType } from '../../enums/discount-type.enum';
import { InvalidDiscountValueError } from './discount-value.error';

export interface DiscountValueProps {
  value: number;
  type: DiscountType;
}

export class DiscountValue {
  static readonly PERCENTAGE_MAX = 10000;
  static readonly MONETARY_MIN = 0;

  private readonly _value: number;

  constructor(props: DiscountValueProps) {
    const { value, type } = props;

    if (!Number.isInteger(value)) {
      throw new InvalidDiscountValueError(value, type);
    }

    if (type === DiscountType.PERCENTAGE) {
      if (value < 0 || value > DiscountValue.PERCENTAGE_MAX) {
        throw new InvalidDiscountValueError(value, type);
      }
    }
    else if (type === DiscountType.MONETARY) {
      if (value < DiscountValue.MONETARY_MIN) {
        throw new InvalidDiscountValueError(value, type);
      }
    }

    this._value = value;
  }

  public get value(): number {
    return this._value;
  }
}
