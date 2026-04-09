import { AppException } from 'src/core/filters/app.exception';
import { BooleanVo } from 'src/shared/value-objects/boolean/boolean.vo';
import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import {
  Billed,
  BilledCreateProps,
  BilledProps,
} from '../entities/billed.entity';

export class BilledFactory {
  private static validateCreateProps(props: BilledCreateProps): BilledCreateProps {
    const description = new NonEmptyString(props.description.trim(), 'description').value;
    const isJunction = new BooleanVo(props.isJunction, 'isJunction').value;

    if (!Array.isArray(props.installmentDays)) {
      throw new AppException('O campo installmentDays deve ser um array de números.', 400);
    }

    const installmentDays = props.installmentDays.map((day, index) => {
      try {
        return new PositiveInt(day, `installmentDays[${index}]`, true).value;
      }
      catch {
        throw new AppException(`O campo installmentDays[${index}] deve ser um número inteiro positivo.`, 400);
      }
    });

    return {
      description,
      isJunction,
      installmentDays: [...new Set(installmentDays)].sort((a, b) => a - b),
    };
  }

  static create(props: BilledCreateProps): Billed {
    const validatedProps = this.validateCreateProps(props);

    return Billed._instantiate({
      ...validatedProps,
      id: null,
      active: true,
    });
  }

  static edit(props: BilledProps): Billed {
    const validatedProps = this.validateCreateProps(props);

    return Billed._instantiate({
      ...validatedProps,
      id: props.id,
      active: props.active,
    });
  }

  static load(props: BilledProps): Billed {
    return Billed._instantiate({
      ...props,
      id: props.id,
      active: props.active,
    });
  }
}
