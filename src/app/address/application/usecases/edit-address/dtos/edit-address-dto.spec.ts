import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditAddressInputDto } from './edit-address.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditAddressInputDto,
};

describe('EditAddressInputDto', () => {
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
      { name: 'street', maxLength: 512 },
    ]
  )('%s', (field) => {
    it(`should not throw an error if ${field.name} is undefined`, async() => {
      // Arrange
      const data = { [field.name]: undefined };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditAddressInputDto);
    });

    it(`should throw an error if ${field.name} is null`, async() => {
      // Arrange
      const data = { [field.name]: null };

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
      { name: 'nickname', maxLength: 256 },
      { name: 'complement', maxLength: 256 },
      { name: 'reference', maxLength: 256 },
    ]
  )('%s', (field) => {
    it.each(
      [
        undefined,
        null,
      ]
    )(`should not throw an error if ${field.name} is empty (%s)`, async(value: any) => {
      // Arrange
      const data = { [field.name]: value };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditAddressInputDto);
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

  it('should pass if all fields are valid', async() => {
    // Arrange
    const data: EditAddressInputDto = {
      nickname: 'Casa',
      zipCode: '12345678',
      street: 'Rua A',
      number: '100',
      complement: 'Apto 101',
      reference: 'Próximo ao mercado',
      neighborhood: 'Bairro B',
      city: 'Cidade C',
      state: 'Estado D',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditAddressInputDto);
    expect(result).toEqual(data);
  });
});
