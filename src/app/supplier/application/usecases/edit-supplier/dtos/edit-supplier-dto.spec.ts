import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { EditSupplierInputDto } from './edit-supplier.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditSupplierInputDto,
};

describe('EditSupplierInputDto', () => {
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
      ]
    )(`should not throw an error if ${field} is empty (%s)`, async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditSupplierInputDto);
    });

    it(`should throw an error if ${field} is null`, async() => {
      // Arrange
      const data = { [field]: null };

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

    it.each(
      [
        '',
        '   ',
      ]
    )(`should throw an error if ${field} is an empty string`, async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} é obrigatório`);
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

  it('should pass if all fields are valid', async() => {
    // Arrange
    const data = {
      cnpj: 'cnpj',
      ie: 'ie',
      group: 'group',
      type: 'type',
      companyName: 'companyName',
      fantasyName: 'fantasyName',
      representative: 'representative',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditSupplierInputDto);
    expect(result).toEqual(data);
  });
});
