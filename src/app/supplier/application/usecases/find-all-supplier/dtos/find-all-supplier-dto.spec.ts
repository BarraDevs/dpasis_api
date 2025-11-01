import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
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
      'companyName',
      'cnpj',
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

  it('should pass if all fields are valid', async() => {
    // Arrange
    const data = {
      companyName: 'Empresa XYZ',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllSupplierQueryDto);
    expect(result).toEqual(data);
  });
});
