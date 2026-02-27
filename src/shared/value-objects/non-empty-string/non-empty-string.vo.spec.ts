import { AppException } from 'src/core/filters/app.exception';
import { NonEmptyString } from './non-empty-string.vo';

describe('NonEmptyString Value Object', () => {
  const fieldName = 'companyName';

  it.each([
    null,
    undefined,
    '',
    '   ',
    '\t',
    '\n',
    ' \t\n ',
  ])('should throw AppException when value is empty or whitespace-only (%s)', (value: unknown) => {
    expect(() => new NonEmptyString(value as string, fieldName)).toThrow(AppException);
    expect(() => new NonEmptyString(value as string, fieldName)).toThrow(`O campo ${fieldName} não pode ser vazio`);});

  it.each([
    123,
    true,
    false,
    {},
    [],
    new Date(),
    new Object(),
    new Map(),
    new Set(),
    new WeakMap(),
    new WeakSet(),
    new Promise(() => {}),
  ])('should throw AppException when value is not a string (%s)', (value: unknown) => {
    expect(() => new NonEmptyString(value as string, fieldName)).toThrow(AppException);
    expect(() => new NonEmptyString(value as string, fieldName)).toThrow(`O campo ${fieldName} não pode ser vazio`);
  });

  it.each([
    'a',
    'hello',
    'Empresa LTDA',
    '123',
    '  value with spaces  ',
  ])('should create NonEmptyString when value is valid (%s)', (value: string) => {
    const vo = new NonEmptyString(value, fieldName);

    expect(vo).toBeInstanceOf(NonEmptyString);
    expect(vo.value).toBe(value);
  });

  it('should include fieldName in error message', () => {
    expect(() => new NonEmptyString('', 'fantasyName')).toThrow('O campo fantasyName não pode ser vazio');
    expect(() => new NonEmptyString('', 'headquarters')).toThrow('O campo headquarters não pode ser vazio');
  });
});
