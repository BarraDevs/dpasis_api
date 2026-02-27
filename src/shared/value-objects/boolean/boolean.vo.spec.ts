import { AppException } from 'src/core/filters/app.exception';
import { BooleanVo } from './boolean.vo';

describe('BooleanVo Value Object', () => {
  const fieldName = 'generateInvoice';

  it.each([
    null,
    undefined,
    '',
    'true',
    'false',
    '1',
    '0',
    0,
    1,
    {},
    [],
    new Date(),
    new Map(),
    new Set(),
    new WeakMap(),
    new WeakSet(),
    new Promise(() => {}),
    new Proxy({}, { get: () => { return () => { }; } }),
    new Proxy({}, { get: () => { return () => { }; } }),
  ])('should throw AppException when value is not a boolean (%s)', (value: unknown) => {
    expect(() => new BooleanVo(value, fieldName)).toThrow(AppException);
    expect(() => new BooleanVo(value, fieldName)).toThrow(
      `O campo ${fieldName} deve ser um valor booleano (true ou false)`,
    );
  });

  it('should create BooleanVo when value is true', () => {
    const vo = new BooleanVo(true, fieldName);

    expect(vo).toBeInstanceOf(BooleanVo);
    expect(vo.value).toBe(true);
  });

  it('should create BooleanVo when value is false', () => {
    const vo = new BooleanVo(false, fieldName);

    expect(vo).toBeInstanceOf(BooleanVo);
    expect(vo.value).toBe(false);
  });

  it('should include fieldName in error message', () => {
    expect(() => new BooleanVo('true', 'active')).toThrow(
      'O campo active deve ser um valor booleano (true ou false)',
    );
  });
});
