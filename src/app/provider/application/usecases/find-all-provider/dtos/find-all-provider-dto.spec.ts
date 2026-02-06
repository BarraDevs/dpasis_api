import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllProviderQueryDto } from './find-all-provider.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: FindAllProviderQueryDto,
};

describe('FindAllProviderQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      'name',
      'cnpj',
      'ie',
      'companyName',
      'address',
    ]
  )('%s field', (field: string) => {
    it.each(
      [
        undefined,
        null,
        '',
        '  ',
      ]
    )(`should not throw an error if ${field} is empty (%s)`, async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllProviderQueryDto);
    });

    it.each(
      [
        123,
        true,
        false,
        {},
        [],
      ]
    )('should throw an error if %s is not a string (%s)', async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message.some((msg: string) => msg.includes(`${field} deve ser um`))).toBe(true);
      });
    });
  });

  describe('companyIds field', () => {
    it.each(
      [
        undefined,
        null,
      ]
    )('should not throw an error if companyIds is empty (%s)', async(value: any) => {
      // Arrange
      const data = { companyIds: value };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllProviderQueryDto);
    });

    it('should throw an error if companyIds is not an array', async() => {
      // Arrange
      const data = { companyIds: 'not-an-array' };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyIds deve ser um array');
      });
    });

    it('should throw an error if companyIds is an empty array', async() => {
      // Arrange
      const data = { companyIds: [] };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyIds deve ter ao menos 1 item');
      });
    });

    it('should throw an error if companyIds contains non-string items', async() => {
      // Arrange
      const data = { companyIds: ['valid-string', 123, true] };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyIds deve ser um texto');
      });
    });
  });

  describe('type (enum) field', () => {
    it.each(
      [
        undefined,
        null,
      ]
    )('should not throw an error if type is empty (%s)', async(value: any) => {
      // Arrange
      const data = { type: value };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllProviderQueryDto);
    });

    it('should accept a valid enum', async() => {
      const data = { type: ProviderType.ONE_TIME };
      const result = await target.transform(data, metadata);
      expect(result.type).toBe(ProviderType.ONE_TIME);
    });

    it.each(
      [
        'random',
        123,
        true,
        {},
        [],
      ]
    )('should throw an error if type is not a valid enum (%s)', async(value: any) => {
      // Arrange
      const data = { type: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(
          error.getResponse().message.some((msg: string) =>
            msg.includes('type deve ser um dos valores')
          )
        ).toBe(true);
      });
    });
  });

  describe('active field', () => {
    it.each(
      [
        undefined,
        null,
      ]
    )('should not throw an error if active is empty (%s)', async(value: any) => {
      // Arrange
      const data = { active: value };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllProviderQueryDto);
    });

    it.each(
      [
        123,
        {},
        [],
      ]
    )('should throw an error if active is not a boolean (%s)', async(value: any) => {
      // Arrange
      const data = { active: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('active deve ser booleano');
      });
    });
  });

  it('should pass if all fields are valid', async() => {
    // Arrange
    const data = {
      name: 'Provider Test',
      type: ProviderType.RECURRING,
      cnpj: '12.345.678/0001-90',
      ie: '123456789',
      companyName: 'Company Ltda',
      companyIds: ['valid-company-id'],
      active: true,
      address: 'Some Address',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllProviderQueryDto);
    expect(result).toEqual(data);
  });
});
