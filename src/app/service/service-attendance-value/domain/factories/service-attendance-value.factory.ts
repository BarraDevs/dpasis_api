import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import { ServiceAttendanceValue, ServiceAttendanceValueCreateProps } from '../entities/service-attendance-value.entity';
import { ServiceAttendanceValuesInvalidError } from '../errors/service-attendance-values-invalid.error';

export class ServiceAttendanceValueFactory {
  private static assertPlainObject(value: unknown): asserts value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new ServiceAttendanceValuesInvalidError('O campo values deve ser um objeto com pelo menos uma chave.');
    }
  }

  private static parseAttendanceValuesMap(raw: unknown): Record<string, number> {
    this.assertPlainObject(raw);

    const entries = Object.entries(raw);
    if (entries.length === 0) {
      throw new ServiceAttendanceValuesInvalidError('O campo values deve conter pelo menos uma chave com valor inteiro positivo.');
    }

    const result: Record<string, number> = {};
    for (const [key, val] of entries) {
      if (typeof key !== 'string') {
        throw new ServiceAttendanceValuesInvalidError('As chaves de values devem ser strings.');
      }
      if (typeof val !== 'number' || !Number.isInteger(val) || val < 1) {
        throw new ServiceAttendanceValuesInvalidError(`O valor para "${key}" deve ser um número inteiro positivo.`);
      }
      result[key] = val;
    }

    return result;
  }

  private static sumValues(values: Record<string, number>): number {
    return Object.values(values).reduce((acc, n) => acc + n, 0);
  }

  static create(props: ServiceAttendanceValueCreateProps): ServiceAttendanceValue {
    const serviceId = new PositiveInt(props.serviceId, 'serviceId').value;
    const values = this.parseAttendanceValuesMap(props.values);
    const totalValueInCents = this.sumValues(values);

    return ServiceAttendanceValue._instantiate({
      id: null,
      serviceId,
      values,
      totalValueInCents,
    });
  }

  static edit(props: {
    id: number;
    serviceId: number;
    values: Record<string, number>;
  }): ServiceAttendanceValue {
    const serviceId = new PositiveInt(props.serviceId, 'serviceId').value;
    const values = this.parseAttendanceValuesMap(props.values);
    const totalValueInCents = this.sumValues(values);

    return ServiceAttendanceValue._instantiate({
      id: props.id,
      serviceId,
      values,
      totalValueInCents,
    });
  }

  static load(props: {
    id: number;
    serviceId: number;
    values: unknown;
  }): ServiceAttendanceValue {
    const values = this.parseAttendanceValuesMap(props.values);
    const totalValueInCents = this.sumValues(values);

    return ServiceAttendanceValue._instantiate({
      id: props.id,
      serviceId: props.serviceId,
      values,
      totalValueInCents,
    });
  }
}
