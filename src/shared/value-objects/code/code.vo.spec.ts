import { isNumber } from 'class-validator';
import { InvalidExpirationTimeError } from './code.error';
import { Code } from './code.vo';

describe('Code Value Object', () => {
  it('should create a code with a value and expiration time', () => {
    const expirationTimeInMinutes = 5;
    const code = new Code(expirationTimeInMinutes);

    expect(code.value.code).toBeDefined();
    expect(code.value.expiresIn).toBeDefined();
  });

  it('should generate a code with 6 digits', () => {
    const expirationTimeInMinutes = 5;
    const code = new Code(expirationTimeInMinutes);

    expect(code.value.code.length).toBe(6);
  });

  it('should generate a code with only numbers', () => {
    const expirationTimeInMinutes = 5;
    const code = new Code(expirationTimeInMinutes);

    const isOnlyNumber = isNumber(+code.value.code);
    expect(isOnlyNumber).toBe(true);
  });

  it.each([1, 5, 10, 250, 10999])('should generate a code that expires in %s minutes', (minutes: number) => {
    const code = new Code(minutes);
    const expirationTime = Date.now() + (minutes * 60 * 1000);
    expect(code.value.expiresIn).toBe(expirationTime);
  });

  it('should throw an error when providing a negative expiration time', () => {
    expect(() => new Code(-1)).toThrow('Tempo de expiração inválido');
    expect(() => new Code(-1)).toThrow(InvalidExpirationTimeError);
  });

  it('should throw an error when providing a zero expiration time', () => {
    expect(() => new Code(0)).toThrow('Tempo de expiração inválido');
    expect(() => new Code(0)).toThrow(InvalidExpirationTimeError);
  });
});
