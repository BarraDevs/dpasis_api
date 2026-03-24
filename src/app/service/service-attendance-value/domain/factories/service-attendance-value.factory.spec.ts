import { NumberMustBePositiveAndInt } from 'src/shared/value-objects/positive-int/positive-int.error';
import { ServiceAttendanceValuesInvalidError } from '../errors/service-attendance-values-invalid.error';
import { ServiceAttendanceValueFactory } from './service-attendance-value.factory';

describe('ServiceAttendanceValueFactory', () => {
  describe('create', () => {
    it('should compute totalValueInCents as sum of values', () => {
      const entity = ServiceAttendanceValueFactory.create({
        serviceId: 1,
        values: { a: 100, b: 200 },
      });

      expect(entity.props.id).toBeNull();
      expect(entity.props.serviceId).toBe(1);
      expect(entity.props.values).toEqual({ a: 100, b: 200 });
      expect(entity.props.totalValueInCents).toBe(300);
    });

    it('should accept a single key and set total to that value', () => {
      const entity = ServiceAttendanceValueFactory.create({
        serviceId: 42,
        values: { unico: 999 },
      });

      expect(entity.props.values).toEqual({ unico: 999 });
      expect(entity.props.totalValueInCents).toBe(999);
    });

    it('should throw when serviceId is invalid', () => {
      expect(() =>
        ServiceAttendanceValueFactory.create({
          serviceId: 0,
          values: { a: 1 },
        }),
      ).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw when serviceId is negative', () => {
      expect(() =>
        ServiceAttendanceValueFactory.create({
          serviceId: -1,
          values: { a: 1 },
        }),
      ).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw when values is empty object', () => {
      expect(() =>
        ServiceAttendanceValueFactory.create({
          serviceId: 1,
          values: {},
        }),
      ).toThrow(ServiceAttendanceValuesInvalidError);
    });

    it('should throw when a value is not an integer at runtime', () => {
      expect(() =>
        ServiceAttendanceValueFactory.create({
          serviceId: 1,
          values: { x: 2.5 } as unknown as Record<string, number>,
        }),
      ).toThrow(ServiceAttendanceValuesInvalidError);
    });

    it('should throw when a value is a string at runtime', () => {
      expect(() =>
        ServiceAttendanceValueFactory.create({
          serviceId: 1,
          values: { x: '100' } as unknown as Record<string, number>,
        }),
      ).toThrow(ServiceAttendanceValuesInvalidError);
    });
  });

  describe('edit', () => {
    it('should recalculate totalValueInCents', () => {
      const entity = ServiceAttendanceValueFactory.edit({
        id: 5,
        serviceId: 2,
        values: { k: 10, k2: 5 },
      });

      expect(entity.props.id).toBe(5);
      expect(entity.props.serviceId).toBe(2);
      expect(entity.props.values).toEqual({ k: 10, k2: 5 });
      expect(entity.props.totalValueInCents).toBe(15);
    });

    it('should keep id and replace values map entirely', () => {
      const entity = ServiceAttendanceValueFactory.edit({
        id: 100,
        serviceId: 1,
        values: { apenas: 50 },
      });

      expect(entity.props.id).toBe(100);
      expect(entity.props.values).toEqual({ apenas: 50 });
      expect(entity.props.totalValueInCents).toBe(50);
    });

    it('should throw when serviceId is invalid', () => {
      expect(() =>
        ServiceAttendanceValueFactory.edit({
          id: 1,
          serviceId: 0,
          values: { a: 1 },
        }),
      ).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw when values is invalid', () => {
      expect(() =>
        ServiceAttendanceValueFactory.edit({
          id: 1,
          serviceId: 1,
          values: {} as Record<string, number>,
        }),
      ).toThrow(ServiceAttendanceValuesInvalidError);
    });

    it('should throw when a value is zero', () => {
      expect(() =>
        ServiceAttendanceValueFactory.edit({
          id: 1,
          serviceId: 1,
          values: { ok: 1, bad: 0 },
        }),
      ).toThrow(ServiceAttendanceValuesInvalidError);
    });
  });

  describe('load', () => {
    it('should parse json-like unknown values', () => {
      const entity = ServiceAttendanceValueFactory.load({
        id: 9,
        serviceId: 3,
        values: { x: 7 },
      });

      expect(entity.props.id).toBe(9);
      expect(entity.props.serviceId).toBe(3);
      expect(entity.props.values).toEqual({ x: 7 });
      expect(entity.props.totalValueInCents).toBe(7);
    });

    it('should sum multiple keys from unknown values (e.g. from DB JSON)', () => {
      const entity = ServiceAttendanceValueFactory.load({
        id: 1,
        serviceId: 10,
        values: { a: 1, b: 2, c: 3 },
      });

      expect(entity.props.totalValueInCents).toBe(6);
      expect(entity.props.values).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should not validate serviceId (pass-through from persistence)', () => {
      const entity = ServiceAttendanceValueFactory.load({
        id: 1,
        serviceId: 0,
        values: { k: 1 },
      });

      expect(entity.props.serviceId).toBe(0);
    });

    it('should throw when values cannot be parsed', () => {
      expect(() =>
        ServiceAttendanceValueFactory.load({
          id: 1,
          serviceId: 1,
          values: null,
        }),
      ).toThrow(ServiceAttendanceValuesInvalidError);
    });

    it('should throw when values is an array', () => {
      expect(() =>
        ServiceAttendanceValueFactory.load({
          id: 1,
          serviceId: 1,
          values: [],
        }),
      ).toThrow(ServiceAttendanceValuesInvalidError);
    });
  });

  describe('assertPlainObject', () => {
    it('should not throw for a plain object (including empty)', () => {
      expect(() => ServiceAttendanceValueFactory['assertPlainObject']({})).not.toThrow();
      expect(() => ServiceAttendanceValueFactory['assertPlainObject']({ x: 1 })).not.toThrow();
    });

    it('should throw ServiceAttendanceValuesInvalidError for null', () => {
      expect(() => ServiceAttendanceValueFactory['assertPlainObject'](null)).toThrow(ServiceAttendanceValuesInvalidError);
      expect(() => ServiceAttendanceValueFactory['assertPlainObject'](null)).toThrow(
        'O campo values deve ser um objeto com pelo menos uma chave.',
      );
    });

    it('should throw for array', () => {
      expect(() => ServiceAttendanceValueFactory['assertPlainObject']([])).toThrow(ServiceAttendanceValuesInvalidError);
    });

    it('should throw for non-object primitives', () => {
      expect(() => ServiceAttendanceValueFactory['assertPlainObject'](undefined)).toThrow(ServiceAttendanceValuesInvalidError);
      expect(() => ServiceAttendanceValueFactory['assertPlainObject']('texto')).toThrow(ServiceAttendanceValuesInvalidError);
      expect(() => ServiceAttendanceValueFactory['assertPlainObject'](42)).toThrow(ServiceAttendanceValuesInvalidError);
      expect(() => ServiceAttendanceValueFactory['assertPlainObject'](true)).toThrow(ServiceAttendanceValuesInvalidError);
    });
  });

  describe('sumValues', () => {
    it('should return 0 for empty object', () => {
      expect(ServiceAttendanceValueFactory['sumValues']({})).toBe(0);
    });

    it('should return the only value for a single key', () => {
      expect(ServiceAttendanceValueFactory['sumValues']({ a: 7 })).toBe(7);
    });

    it('should sum all values', () => {
      expect(ServiceAttendanceValueFactory['sumValues']({ a: 10, b: 20, c: 30 })).toBe(60);
    });

    it('should handle large integers', () => {
      expect(ServiceAttendanceValueFactory['sumValues']({ x: 1_000_000, y: 2_000_000 })).toBe(3_000_000);
    });
  });

  describe('parseAttendanceValuesMap', () => {
    it('should return a copy of valid entries', () => {
      const input = { a: 1, b: 2 };
      const result = ServiceAttendanceValueFactory['parseAttendanceValuesMap'](input);

      expect(result).toEqual({ a: 1, b: 2 });
      expect(result).not.toBe(input);
    });

    it('should reject empty object', () => {
      expect(() => ServiceAttendanceValueFactory['parseAttendanceValuesMap']({})).toThrow(ServiceAttendanceValuesInvalidError);
    });

    it('should reject null', () => {
      expect(() => ServiceAttendanceValueFactory['parseAttendanceValuesMap'](null)).toThrow(ServiceAttendanceValuesInvalidError);
    });

    it('should reject array', () => {
      expect(() => ServiceAttendanceValueFactory['parseAttendanceValuesMap']([])).toThrow(ServiceAttendanceValuesInvalidError);
    });

    it('should reject non-object primitives', () => {
      expect(() => ServiceAttendanceValueFactory['parseAttendanceValuesMap']('x')).toThrow(ServiceAttendanceValuesInvalidError);
      expect(() => ServiceAttendanceValueFactory['parseAttendanceValuesMap'](42)).toThrow(ServiceAttendanceValuesInvalidError);
    });

    it('should reject non-integer value', () => {
      expect(() => ServiceAttendanceValueFactory['parseAttendanceValuesMap']({ x: 1.5 })).toThrow(ServiceAttendanceValuesInvalidError);
    });

    it('should reject NaN and Infinity', () => {
      expect(() => ServiceAttendanceValueFactory['parseAttendanceValuesMap']({ x: NaN })).toThrow(ServiceAttendanceValuesInvalidError);
      expect(() => ServiceAttendanceValueFactory['parseAttendanceValuesMap']({ x: Number.POSITIVE_INFINITY })).toThrow(
        ServiceAttendanceValuesInvalidError,
      );
    });

    it('should reject zero or negative value', () => {
      expect(() => ServiceAttendanceValueFactory['parseAttendanceValuesMap']({ x: 0 })).toThrow(ServiceAttendanceValuesInvalidError);
      expect(() => ServiceAttendanceValueFactory['parseAttendanceValuesMap']({ x: -1 })).toThrow(ServiceAttendanceValuesInvalidError);
    });

    it('should reject non-number value', () => {
      expect(() => ServiceAttendanceValueFactory['parseAttendanceValuesMap']({ x: true })).toThrow(ServiceAttendanceValuesInvalidError);
      expect(() => ServiceAttendanceValueFactory['parseAttendanceValuesMap']({ x: null })).toThrow(ServiceAttendanceValuesInvalidError);
    });

    it('should include key name in error message for invalid value', () => {
      expect(() => ServiceAttendanceValueFactory['parseAttendanceValuesMap']({ meuCampo: 1.2 })).toThrow(
        /meuCampo/,
      );
    });
  });
});
