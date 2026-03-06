import { AppException } from 'src/core/filters/app.exception';
import { BooleanVo } from 'src/shared/value-objects/boolean/boolean.vo';
import { Enum } from 'src/shared/value-objects/enum/enum.vo';
import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import {
  ClientDiscount,
  ClientDiscountCreateProps,
  ClientDiscountProps,
} from '../entities/client-discount.entity';
import { DiscountType } from '../enums/discount-type.enum';
import { DiscountValue } from '../value-objects/discount-value/discount-value.vo';

const MIN_YEAR = 2020;
const MIN_MONTH = 1;
const MAX_MONTH = 12;

export class ClientDiscountFactory {
  private static validateCreateProps(props: ClientDiscountCreateProps): ClientDiscountCreateProps {
    const type = new Enum(props.type, DiscountType, 'type').value;
    const discountValue = new DiscountValue({ value: props.discountValue, type }).value;

    const month = new PositiveInt(props.month, 'month').value;
    if (month < MIN_MONTH || month > MAX_MONTH) {
      throw new AppException(`O campo month deve ser entre ${MIN_MONTH} e ${MAX_MONTH}.`, 400);
    }

    const year = new PositiveInt(props.year, 'year', true).value;
    if (year < MIN_YEAR) {
      throw new AppException(`O campo year deve ser maior ou igual a ${MIN_YEAR}.`, 400);
    }

    return {
      clientId: new PositiveInt(props.clientId, 'clientId').value,
      description: new NonEmptyString(props.description.trim(), 'description').value,
      type,
      discountValue,
      month,
      year,
      doNotGenerateCharge: new BooleanVo(props.doNotGenerateCharge, 'doNotGenerateCharge').value,
      terminateContract: new BooleanVo(props.terminateContract, 'terminateContract').value,
    };
  }

  static create(props: ClientDiscountCreateProps): ClientDiscount {
    const validatedProps = this.validateCreateProps(props);

    return ClientDiscount._instantiate({
      ...validatedProps,
      id: null,
    });
  }

  static edit(props: ClientDiscountProps): ClientDiscount {
    const validatedProps = this.validateCreateProps(props);

    return ClientDiscount._instantiate({
      ...validatedProps,
      id: props.id,
    });
  }

  static load(props: ClientDiscountProps): ClientDiscount {
    return ClientDiscount._instantiate({
      ...props,
      id: props.id,
    });
  }
}
