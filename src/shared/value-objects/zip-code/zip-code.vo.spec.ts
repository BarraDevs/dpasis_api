import { InvalidZipCodeError } from './zip-code.error';
import { ZipCode } from './zip-code.vo';

describe('ZipCode - Unit tests', () => {
  it('should be defined', () => {
    expect(ZipCode).toBeDefined();
  });

  it.each([
    '',
    '           ',
    '123',
    '1234567',
    '123456789',
    '12-34-56',
    'abcd',
    '12ab34cd',
    '12345-67',
  ])('should throw when zip code is invalid (%s)', (zipCode: string) => {
    expect(() => new ZipCode(zipCode)).toThrow(`CEP inválido: ${zipCode}`);
    expect(() => new ZipCode(zipCode)).toThrow(InvalidZipCodeError);
  });

  it.each([
    ['22270-010', '22270010'],
    ['01310100', '01310100'],
    ['01.310-100', '01310100'],
    ['01310 100', '01310100'],
    ['00000-000', '00000000'],
    ['99999-999', '99999999'],
  ])('should create zip code value object when providing valid zip code (%s)', (zipCode: string, expected: string) => {
    // Act
    const sut = new ZipCode(zipCode);

    // Assert
    expect(sut).toBeInstanceOf(ZipCode);
    expect(sut.value).toBe(expected);
  });

  it('should sanitize zip code removing non digits', () => {
    // Act
    const sut = new ZipCode('22270-010');

    // Assert
    expect(sut.value).toBe('22270010');
  });

  it('should preserve leading zeros after sanitization', () => {
    // Act
    const sut = new ZipCode('01.310-100');

    // Assert
    expect(sut.value).toBe('01310100');
  });
});
