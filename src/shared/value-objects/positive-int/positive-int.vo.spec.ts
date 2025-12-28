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
    expect(() => new PositiveInt(value, resource)).toThrow('Quantidade deve ser um inteiro positivo');
    expect(() => new PositiveInt(value, resource)).toThrow(NumberMustBePositiveAndInt);
  });

  it.each([
    1.5,
    2.3,
    10.7,
    0.1,
  ])('should throw an error when providing decimal number (%s)', (value: number) => {
    expect(() => new PositiveInt(value, resource)).toThrow('Quantidade deve ser um inteiro positivo');
    expect(() => new PositiveInt(value, resource)).toThrow(NumberMustBePositiveAndInt);
  });

  it.each([
    NaN,
    Infinity,
    -Infinity,
  ])('should throw an error when providing invalid number (%s)', (value: number) => {
    expect(() => new PositiveInt(value, resource)).toThrow('Quantidade deve ser um inteiro positivo');
    expect(() => new PositiveInt(value, resource)).toThrow(NumberMustBePositiveAndInt);
  });

  it.each([
    0,
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
});
