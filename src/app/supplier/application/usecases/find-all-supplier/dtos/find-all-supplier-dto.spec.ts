import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllSupplierQueryDto } from './find-all-supplier.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: FindAllSupplierQueryDto,
};

describe('FindAllSupplierQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      'cnpj',
      'ie',
      'group',
      'type',
      'companyName',
      'fantasyName',
      'representative',
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
      expect(result).toBeInstanceOf(FindAllSupplierQueryDto);
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
      expect(result).toBeInstanceOf(FindAllSupplierQueryDto);
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
      expect(result).toBeInstanceOf(FindAllSupplierQueryDto);
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
      cnpj: '12.345.678/0001-90',
      ie: '123456789',
      group: 'Grupo Exemplo',
      type: 'Tipo Exemplo',
      companyName: 'Nome da Empresa',
      fantasyName: 'Nome Fantasia',
      representative: 'Representante Exemplo',
      companyIds: ['companyId1', 'companyId2'],
      active: true,
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllSupplierQueryDto);
    expect(result).toEqual(data);
  });
});
