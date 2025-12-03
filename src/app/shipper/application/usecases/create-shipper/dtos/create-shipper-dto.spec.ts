import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { CreateShipperInputDto } from './create-shipper.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateShipperInputDto,
};

describe('CreateShipperInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      { name: 'companyName', length: 256 },
      { name: 'fantasyName', length: 256 },
      { name: 'cnpj', length: 256 },
      { name: 'contact', length: 256 },
      { name: 'representative', length: 256 },
      { name: 'zipCode', length: 256 },
      { name: 'street', length: 512 },
      { name: 'number', length: 256 },
      { name: 'neighborhood', length: 256 },
      { name: 'city', length: 256 },
      { name: 'state', length: 256 },
    ]
  )('%s["name"] field', (field) => {
    it.each(
      [
        undefined,
        null,
        '',
        '  ',
      ]
    )(`should throw an error if ${field.name} is empty (%s)`, async(value: any) => {
      // Arrange
      const data = { [field.name]: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field.name} é obrigatório`);
      });
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
      const data = { [field.name]: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field.name} deve ser uma string`);
      });
    });

    it(`should throw an error if ${field.name} exceeds maximum length`, async() => {
      // Arrange
      const data = { [field.name]: 'a'.repeat(field.length + 1) };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field.name} deve ter no máximo ${field.length} caracteres`);
      });
    });
  });

  describe.each(
    [
      'complement',
      'reference',
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

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain(`${field} é obrigatório`);
      });
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
        expect(error.getResponse().message).toContain(`${field} deve ser uma string`);
      });
    });

    it(`should throw an error if ${field} exceeds maximum length`, async() => {
      // Arrange
      const data = { [field]: 'a'.repeat(257) };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ter no máximo 256 caracteres`);
      });
    });
  });

  describe('companyIds field', () => {
    it.each(
      [
        undefined,
        null,
      ]
    )('should throw an error if companyIds is empty (%s)', async(value: any) => {
      // Arrange
      const data = { companyIds: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyIds deve ser um array');
      });
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
        expect(error.getResponse().message).toContain('companyIds deve ser uma string');
      });
    });
  });

  it('should pass if all fields are valid', async() => {
    // Arrange
    const data = {
      companyName: 'Valid Company Name',
      fantasyName: 'Valid Fantasy Name',
      cnpj: '12.345.678/0001-90',
      contact: 'Valid Contact',
      representative: 'Valid Representative',
      zipCode: '12345-678',
      street: 'Valid Street',
      number: '123',
      complement: 'Valid Complement',
      reference: 'Valid Reference',
      neighborhood: 'Valid Neighborhood',
      city: 'Valid City',
      state: 'Valid State',
      companyIds: ['companyId1', 'companyId2'],
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateShipperInputDto);
    expect(result).toEqual(data);
  });

  it('should pass if optional fields are omitted', async() => {
    // Arrange
    const data = {
      companyName: 'Valid Company Name',
      fantasyName: 'Valid Fantasy Name',
      cnpj: '12.345.678/0001-90',
      contact: 'Valid Contact',
      representative: 'Valid Representative',
      zipCode: '12345-678',
      street: 'Valid Street',
      number: '123',
      neighborhood: 'Valid Neighborhood',
      city: 'Valid City',
      state: 'Valid State',
      companyIds: ['companyId1', 'companyId2'],
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateShipperInputDto);
    expect(result).toEqual({
      ...data,
      complement: undefined,
      reference: undefined,
    });
  });
});
