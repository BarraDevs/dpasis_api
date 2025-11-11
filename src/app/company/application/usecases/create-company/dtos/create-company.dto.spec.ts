import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { CreateCompanyInputDto } from './create-company.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateCompanyInputDto,
};

describe('CreateCompanyInputDto', () => {
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
  )('%s field', (field: string) => {
    it.each(
      [
        undefined,
        null,
        '',
        '  ',
      ]
    )(`should throw an error if ${field} is empty (%s)`, async(value: any) => {
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
        name: 'Empresa Exemplo Ltda',
        fantasyName: 'Empresa Exemplo',
        document: '12.345.678/0001-90',
        ie: '123.456.789.012',
        phone01: '(11) 1234-5678',
        email01: 'contato@empresa.com.br',
        zipCode: '12345-678',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        [field]: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CreateCompanyInputDto);
    });

    it(`should pass validation if ${field} is undefined`, async() => {
      // Arrange
      const data = {
        name: 'Empresa Exemplo Ltda',
        fantasyName: 'Empresa Exemplo',
        document: '12.345.678/0001-90',
        ie: '123.456.789.012',
        phone01: '(11) 1234-5678',
        email01: 'contato@empresa.com.br',
        zipCode: '12345-678',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CreateCompanyInputDto);
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
        name: 'Empresa Exemplo Ltda',
        fantasyName: 'Empresa Exemplo',
        document: '12.345.678/0001-90',
        ie: '123.456.789.012',
        phone01: '(11) 1234-5678',
        email01: 'contato@empresa.com.br',
        zipCode: '12345-678',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
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
        name: 'Empresa Exemplo Ltda',
        fantasyName: 'Empresa Exemplo',
        document: '12.345.678/0001-90',
        ie: '123.456.789.012',
        phone01: '(11) 1234-5678',
        email01: 'contato@empresa.com.br',
        zipCode: '12345-678',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        [field]: 'a'.repeat(257),
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ter no máximo 256 caracteres`);
      });
    });
  });

  it('should pass if all required fields are valid', async() => {
    // Arrange
    const data = {
      name: 'Empresa Exemplo Ltda',
      fantasyName: 'Empresa Exemplo',
      document: '12.345.678/0001-90',
      ie: '123.456.789.012',
      phone01: '(11) 1234-5678',
      email01: 'contato@empresa.com.br',
      zipCode: '12345-678',
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateCompanyInputDto);
    expect(result).toEqual(data);
  });

  it('should pass if all fields (including optional) are valid', async() => {
    // Arrange
    const data = {
      name: 'Empresa Exemplo Ltda',
      fantasyName: 'Empresa Exemplo',
      document: '12.345.678/0001-90',
      ie: '123.456.789.012',
      phone01: '(11) 1234-5678',
      phone02: '(11) 8765-4321',
      cellphone: '(11) 98765-4321',
      email01: 'contato@empresa.com.br',
      email02: 'vendas@empresa.com.br',
      zipCode: '12345-678',
      street: 'Rua das Flores',
      number: '123',
      complement: 'Sala 45',
      reference: 'Próximo ao shopping',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateCompanyInputDto);
    expect(result).toEqual(data);
  });

  it('should trim whitespace from string fields', async() => {
    // Arrange
    const data = {
      name: '  Empresa Exemplo Ltda  ',
      fantasyName: '  Empresa Exemplo  ',
      document: '  12.345.678/0001-90  ',
      ie: '  123.456.789.012  ',
      phone01: '  (11) 1234-5678  ',
      email01: '  contato@empresa.com.br  ',
      zipCode: '  12345-678  ',
      street: '  Rua das Flores  ',
      number: '  123  ',
      neighborhood: '  Centro  ',
      city: '  São Paulo  ',
      state: '  SP  ',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateCompanyInputDto);
    expect(result.name).toBe('Empresa Exemplo Ltda');
    expect(result.fantasyName).toBe('Empresa Exemplo');
    expect(result.document).toBe('12.345.678/0001-90');
    expect(result.ie).toBe('123.456.789.012');
    expect(result.phone01).toBe('(11) 1234-5678');
    expect(result.email01).toBe('contato@empresa.com.br');
    expect(result.zipCode).toBe('12345-678');
    expect(result.street).toBe('Rua das Flores');
    expect(result.number).toBe('123');
    expect(result.neighborhood).toBe('Centro');
    expect(result.city).toBe('São Paulo');
    expect(result.state).toBe('SP');
  });
});
