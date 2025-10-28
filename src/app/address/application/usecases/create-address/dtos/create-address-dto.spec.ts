import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { CreateAddressInputDto } from './create-address.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateAddressInputDto,
};

describe('CreateAddressInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      { name: 'zipCode', maxLength: 256 },
      { name: 'number', maxLength: 256 },
      { name: 'neighborhood', maxLength: 256 },
      { name: 'city', maxLength: 256 },
      { name: 'state', maxLength: 256 },
      { name: 'ownerId', maxLength: 256 },
      { name: 'street', maxLength: 512 },
    ]
  )('%s', (field) => {
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
    )(`should throw an error if ${field.name} is not a string (%s)`, async(value: any) => {
      // Arrange
      const data = { [field.name]: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field.name} deve ser uma string`);
      });
    });

    it(`should throw an error if ${field.name} exceeds maximum length (${field.maxLength})`, async() => {
      // Arrange
      const longString = 'a'.repeat(field.maxLength + 1);
      const data = { [field.name]: longString };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field.name} deve ter no máximo ${field.maxLength} caracteres`);
      });
    });
  });

  describe.each(
    [
      'nickname',
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
    )(`should throw an error if ${field} is not a string (%s)`, async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser uma string`);
      });
    });
  });

  it('should pass if all fields are valid', async() => {
    // Arrange
    const data: CreateAddressInputDto = {
      nickname: 'Casa',
      zipCode: '12345678',
      street: 'Rua A',
      number: '100',
      complement: 'Apto 101',
      reference: 'Próximo ao mercado',
      neighborhood: 'Bairro B',
      city: 'Cidade C',
      state: 'Estado D',
      ownerId: 'owner-123',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateAddressInputDto);
    expect(result).toEqual(data);
  });

  it('should pass if all required fields are valid and optional fields are missing', async() => {
    // Arrange
    const data: CreateAddressInputDto = {
      zipCode: '12345678',
      street: 'Rua A',
      number: '100',
      neighborhood: 'Bairro B',
      city: 'Cidade C',
      state: 'Estado D',
      ownerId: 'owner-123',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateAddressInputDto);
    expect(result).toEqual(data);
  });
});
