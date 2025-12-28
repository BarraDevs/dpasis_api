import { NumberMustBePositiveAndInt } from './positive-int.error';
import { PositiveInt } from './positive-int.vo';

describe('PositiveInt Value Object', () => {
  const resource = 'Quantidade';

  it.each([
    -1,
    -10,
    -100,
    -9.94,
    -3.1416,
  ])('should throw an error when providing negative number (%s)', (value: number) => {
    expect(() => new PositiveInt(value, resource)).toThrow('Quantidade deve ser um número inteiro positivo');
    expect(() => new PositiveInt(value, resource)).toThrow(NumberMustBePositiveAndInt);
  });

  it.each([
    1.5,
    2.3,
    10.7,
    0.1,
  ])('should throw an error when providing decimal number (%s)', (value: number) => {
    expect(() => new PositiveInt(value, resource)).toThrow('Quantidade deve ser um número inteiro positivo');
    expect(() => new PositiveInt(value, resource)).toThrow(NumberMustBePositiveAndInt);
  });

  it.each([
    NaN,
    Infinity,
    -Infinity,
  ])('should throw an error when providing invalid number (%s)', (value: number) => {
    expect(() => new PositiveInt(value, resource)).toThrow('Quantidade deve ser um número inteiro positivo');
    expect(() => new PositiveInt(value, resource)).toThrow(NumberMustBePositiveAndInt);
  });

  it.each([
    1,
    10,
    100,
    1000,
    9999999,
  ])('should create a PositiveInt value object when providing valid number (%s)', (value: number) => {
    const positiveIntVo = new PositiveInt(value, resource);

    expect(positiveIntVo).toBeInstanceOf(PositiveInt);
    expect(positiveIntVo.value).toBe(value);
  });

  it('should create a PositiveInt value object when providing zero and includeZero is true', () => {
    const value = 0;
    const positiveIntVo = new PositiveInt(value, resource, true);

    expect(positiveIntVo).toBeInstanceOf(PositiveInt);
    expect(positiveIntVo.value).toBe(value);
  });

  it('should throw an error when providing zero and includeZero is false', () => {
    const value = 0;
    expect(() => new PositiveInt(value, resource, false)).toThrow('Quantidade deve ser um número inteiro positivo');
    expect(() => new PositiveInt(value, resource, false)).toThrow(NumberMustBePositiveAndInt);
  });

  it('should throw an error when providing zero and includeZero is not provided (default false)', () => {
    const value = 0;
    expect(() => new PositiveInt(value, resource)).toThrow('Quantidade deve ser um número inteiro positivo');
    expect(() => new PositiveInt(value, resource)).toThrow(NumberMustBePositiveAndInt);
  });

  it('should accept different resource names in error message', () => {
    const customResource = 'Idade';
    expect(() => new PositiveInt(-1, customResource)).toThrow('Idade deve ser um número inteiro positivo');
    expect(() => new PositiveInt(-1, customResource)).toThrow(NumberMustBePositiveAndInt);
  });

  it('should handle boundary value 1 when includeZero is false', () => {
    const value = 1;
    const positiveIntVo = new PositiveInt(value, resource, false);

    expect(positiveIntVo).toBeInstanceOf(PositiveInt);
    expect(positiveIntVo.value).toBe(1);
  });

  it('should handle large positive integers', () => {
    const value = Number.MAX_SAFE_INTEGER;
    const positiveIntVo = new PositiveInt(value, resource);

    expect(positiveIntVo).toBeInstanceOf(PositiveInt);
    expect(positiveIntVo.value).toBe(value);
  });

  it('should throw an error for floating point precision edge cases', () => {
    const value = 1.0000000001;
    expect(() => new PositiveInt(value, resource)).toThrow('Quantidade deve ser um número inteiro positivo');
    expect(() => new PositiveInt(value, resource)).toThrow(NumberMustBePositiveAndInt);
  });

  it.each([
    1,
    10,
    100,
  ])('should work correctly with includeZero explicitly set to false (%s)', (value: number) => {
    const positiveIntVo = new PositiveInt(value, resource, false);

    expect(positiveIntVo).toBeInstanceOf(PositiveInt);
    expect(positiveIntVo.value).toBe(value);
  });

  it.each([
    0,
    1,
    10,
  ])('should work correctly with includeZero explicitly set to true (%s)', (value: number) => {
    const positiveIntVo = new PositiveInt(value, resource, true);

    expect(positiveIntVo).toBeInstanceOf(PositiveInt);
    expect(positiveIntVo.value).toBe(value);
  });
});
