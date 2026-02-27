import { OptionalString } from './optional-string.vo';

describe('OptionalString Value Object', () => {
  const fieldName = 'fantasyName';

  it.each([
    null,
    undefined,
    '',
    '   ',
    '\t',
    '\n',
    ' \t\n ',
  ])('should return null when value is empty or not provided (%s)', (value: unknown) => {
    const vo = new OptionalString(value as string, fieldName);

    expect(vo).toBeInstanceOf(OptionalString);
    expect(vo.value).toBeNull();
  });

  it.each([
    'a',
    'hello',
    'Empresa LTDA',
    '123',
    '  value with spaces  ',
  ])('should create OptionalString with value when valid string is provided (%s)', (value: string) => {
    const vo = new OptionalString(value, fieldName);

    expect(vo).toBeInstanceOf(OptionalString);
    expect(vo.value).toBe(value);
  });

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
  ])('should return null when value is not a string (%s)', (value: unknown) => {
    expect(new OptionalString(value as string, fieldName).value).toBeNull();
  });

  it('should return null when value is string with only whitespace', () => {
    const vo = new OptionalString('   ', 'ie');
    expect(vo.value).toBeNull();
  });

  it('should delegate validation to NonEmptyString when value has content', () => {
    const vo = new OptionalString('valid content', fieldName);

    expect(vo.value).toBe('valid content');
  });
});
