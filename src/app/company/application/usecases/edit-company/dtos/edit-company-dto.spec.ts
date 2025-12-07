import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditCompanyInputDto } from './edit-company.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditCompanyInputDto,
};

describe('EditCompanyInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      'name',
      'fantasyName',
      'document',
      'ie',
      'phone01',
      'email01',
      'zipCode',
      'street',
      'number',
      'neighborhood',
      'city',
      'state',
    ]
  )('%s field (when provided)', (field: string) => {
    it.each(
      [
        '',
        '  ',
      ]
    )(`should throw an error if ${field} is empty string (%s)`, async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} é obrigatório`);
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

    it(`should pass validation if ${field} is not provided (undefined)`, async() => {
      // Arrange
      const data = {};

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditCompanyInputDto);
    });
  });

  describe.each(
    [
      'phone02',
      'cellphone',
      'email02',
      'complement',
      'reference',
    ]
  )('%s optional field', (field: string) => {
    it(`should pass validation if ${field} is null`, async() => {
      // Arrange
      const data = {
        [field]: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditCompanyInputDto);
    });

    it(`should pass validation if ${field} is undefined`, async() => {
      // Arrange
      const data = {};

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditCompanyInputDto);
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
      const data = {
        [field]: value,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser uma string`);
      });
    });

    it(`should throw an error if ${field} exceeds maximum length`, async() => {
      // Arrange
      const data = {
        [field]: 'a'.repeat(257),
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ter no máximo 256 caracteres`);
      });
    });
  });

  it('should pass if only one field is provided', async() => {
    // Arrange
    const data: EditCompanyInputDto = {
      name: 'Empresa Atualizada Ltda',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditCompanyInputDto);
    expect(result).toEqual(data);
  });

  it('should pass if some fields are provided', async() => {
    // Arrange
    const data: EditCompanyInputDto = {
      name: 'Empresa Atualizada Ltda',
      fantasyName: 'Empresa Atualizada',
      phone01: '(11) 9999-8888',
      email01: 'novo@empresa.com.br',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditCompanyInputDto);
    expect(result).toEqual(data);
  });

  it('should pass if all fields (including optional) are provided', async() => {
    // Arrange
    const data: EditCompanyInputDto = {
      name: 'Empresa Atualizada Ltda',
      fantasyName: 'Empresa Atualizada',
      document: '98.765.432/0001-87',
      ie: '987.654.321.098',
      phone01: '(11) 9999-8888',
      phone02: '(11) 7777-6666',
      cellphone: '(11) 99999-8888',
      email01: 'novo@empresa.com.br',
      email02: 'vendas-novo@empresa.com.br',
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
    expect(result).toBeInstanceOf(EditCompanyInputDto);
    expect(result).toEqual(data);
  });

  it('should pass with empty object (no fields to update)', async() => {
    // Arrange
    const data: EditCompanyInputDto = {};

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditCompanyInputDto);
    expect(result).toEqual(data);
  });

  it('should trim whitespace from string fields when provided', async() => {
    // Arrange
    const data: EditCompanyInputDto = {
      name: '  Empresa Atualizada Ltda  ',
      fantasyName: '  Empresa Atualizada  ',
      document: '  98.765.432/0001-87  ',
      ie: '  987.654.321.098  ',
      phone01: '  (11) 9999-8888  ',
      email01: '  novo@empresa.com.br  ',
      zipCode: '  87654-321  ',
      street: '  Avenida das Palmeiras  ',
      number: '  456  ',
      neighborhood: '  Vila Nova  ',
      city: '  Rio de Janeiro  ',
      state: '  RJ  ',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditCompanyInputDto);
    expect(result.name).toBe('Empresa Atualizada Ltda');
    expect(result.fantasyName).toBe('Empresa Atualizada');
    expect(result.document).toBe('98.765.432/0001-87');
    expect(result.ie).toBe('987.654.321.098');
    expect(result.phone01).toBe('(11) 9999-8888');
    expect(result.email01).toBe('novo@empresa.com.br');
    expect(result.zipCode).toBe('87654-321');
    expect(result.street).toBe('Avenida das Palmeiras');
    expect(result.number).toBe('456');
    expect(result.neighborhood).toBe('Vila Nova');
    expect(result.city).toBe('Rio de Janeiro');
    expect(result.state).toBe('RJ');
  });

  it('should handle mixed valid and null optional fields', async() => {
    // Arrange
    const data: EditCompanyInputDto = {
      name: 'Empresa Atualizada Ltda',
      phone02: null,
      cellphone: '(11) 99999-8888',
      email02: null,
      complement: 'Sala 123',
      reference: null,
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditCompanyInputDto);
    expect(result).toEqual(data);
  });
});
