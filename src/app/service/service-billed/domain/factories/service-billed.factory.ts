import { AppException } from 'src/core/filters/app.exception';
import { BooleanVo } from 'src/shared/value-objects/boolean/boolean.vo';
import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import {
  ServiceBilled,
  ServiceBilledCreateProps,
  ServiceBilledProps,
} from '../entities/service-billed.entity';

export class ServiceBilledFactory {
  private static validateCreateProps(props: ServiceBilledCreateProps): ServiceBilledCreateProps {
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

  static create(props: ServiceBilledCreateProps): ServiceBilled {
    const validatedProps = this.validateCreateProps(props);

    return ServiceBilled._instantiate({
      ...validatedProps,
      id: null,
      active: true,
    });
  }

  static edit(props: ServiceBilledProps): ServiceBilled {
    const validatedProps = this.validateCreateProps(props);

    return ServiceBilled._instantiate({
      ...validatedProps,
      id: props.id,
      active: props.active,
    });
  }

  static load(props: ServiceBilledProps): ServiceBilled {
    return ServiceBilled._instantiate({
      ...props,
      id: props.id,
      active: props.active,
    });
  }
}
