import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CnpjLookupInputDto } from './cnpj-lookup.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CnpjLookupInputDto,
};

describe('CnpjLookupInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
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
  });

  it('should pass if all fields are valid', async() => {
    // Arrange
    const data = {
      cnpj: '09.748.165/0001-10',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CnpjLookupInputDto);
    expect(result).toEqual(data);
  });
});
