import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllShipperQueryDto } from './find-all-shipper.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: FindAllShipperQueryDto,
};

describe('FindAllShipperQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      'companyName',
      'fantasyName',
      'cnpj',
      'contact',
      'representative',
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
      expect(result).toBeInstanceOf(FindAllShipperQueryDto);
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
        expect(error.getResponse().message).toContain(`${field} deve ser um texto`);
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
      expect(result).toBeInstanceOf(FindAllShipperQueryDto);
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
      expect(result).toBeInstanceOf(FindAllShipperQueryDto);
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
        expect(error.getResponse().message).toContain('active deve ser um valor booleano');
      });
    });
  });

  it('should pass if all fields are valid', async() => {
    // Arrange
    const data = {
      companyName: 'Empresa XYZ',
      fantasyName: 'Fantasia XYZ',
      cnpj: '12.345.678/0001-90',
      contact: 'João Silva',
      representative: 'Maria Souza',
      address: 'Rua das Flores, 123',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllShipperQueryDto);
    expect(result).toEqual(data);
  });
});
