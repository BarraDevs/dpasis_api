import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditShipperInputDto } from './edit-shipper.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditShipperInputDto,
};

describe('EditShipperInputDto', () => {
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
        '',
        '  ',
      ]
    )(`should throw an error if ${field.name} is empty string (%s)`, async(value: any) => {
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

    it(`should pass validation if ${field.name} is not provided (undefined)`, async() => {
      // Arrange
      const data = {};

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditShipperInputDto);
    });
  });

  describe('companyIds field', () => {
    it.each(
      [
        undefined,
      ]
    )('should not throw an error if companyIds is empty (%s)', async(value: any) => {
      // Arrange
      const data = { companyIds: value };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditShipperInputDto);
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

  it('should pass if only one field is provided', async() => {
    // Arrange
    const data: EditShipperInputDto = {
      companyName: 'Empresa Atualizada Ltda',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditShipperInputDto);
    expect(result).toEqual(data);
  });

  it('should pass if some fields are provided', async() => {
    // Arrange
    const data: EditShipperInputDto = {
      companyName: 'Empresa Atualizada Ltda',
      fantasyName: 'Empresa Atualizada',
      representative: 'João Silva',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditShipperInputDto);
    expect(result).toEqual(data);
  });

  it('should pass if all fields (including optional) are provided', async() => {
    // Arrange
    const data: EditShipperInputDto = {
      companyName: 'Empresa Atualizada Ltda',
      fantasyName: 'Empresa Atualizada',
      cnpj: '98.765.432/0001-87',
      contact: 'Maria Oliveira',
      representative: 'João Silva',
      zipCode: '87654-321',
      street: 'Avenida das Palmeiras',
      number: '456',
      complement: 'Andar 10',
      reference: 'Próximo à estação',
      neighborhood: 'Vila Nova',
      city: 'Rio de Janeiro',
      state: 'RJ',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditShipperInputDto);
    expect(result).toEqual(data);
  });

  it('should pass with empty object (no fields to update)', async() => {
    // Arrange
    const data: EditShipperInputDto = {};

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditShipperInputDto);
    expect(result).toEqual(data);
  });

  it('should trim whitespace from string fields when provided', async() => {
    // Arrange
    const data: EditShipperInputDto = {
      companyName: '  Empresa Atualizada Ltda  ',
      fantasyName: '  Empresa Atualizada  ',
      cnpj: '  98.765.432/0001-87  ',
      contact: '  Maria Oliveira  ',
      representative: '  João Silva  ',
      zipCode: '  87654-321  ',
      street: '  Avenida das Palmeiras  ',
      number: '  456  ',
      complement: '  Andar 10  ',
      reference: '  Próximo à estação  ',
      neighborhood: '  Vila Nova  ',
      city: '  Rio de Janeiro  ',
      state: '  RJ  ',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditShipperInputDto);
    expect(result).toEqual({
      companyName: 'Empresa Atualizada Ltda',
      fantasyName: 'Empresa Atualizada',
      cnpj: '98.765.432/0001-87',
      contact: 'Maria Oliveira',
      representative: 'João Silva',
      zipCode: '87654-321',
      street: 'Avenida das Palmeiras',
      number: '456',
      complement: 'Andar 10',
      reference: 'Próximo à estação',
      neighborhood: 'Vila Nova',
      city: 'Rio de Janeiro',
      state: 'RJ',
    });
  });

  it('should handle mixed valid and null optional fields', async() => {
    // Arrange
    const data: EditShipperInputDto = {
      companyName: 'Empresa Atualizada Ltda',
      complement: 'Sala 123',
      reference: null,
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditShipperInputDto);
    expect(result).toEqual(data);
  });
});
