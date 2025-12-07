import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditClientInputDto } from './edit-client.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditClientInputDto,
};

describe('EditClientInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      'kind',
      'cnpj',
      'ie',
      'group',
      'type',
      'companyName',
      'fantasyName',
      'owner',
      'headquarters',
    ]
  )('%s field', (field: string) => {
    it.each(
      [
        undefined,
        null,
      ]
    )(`should not throw an error if ${field} is empty (%s)`, async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditClientInputDto);
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

  describe.each(
    [
      'generateInvoice',
    ]
  )('%s field', (field: string) => {
    it.each(
      [
        undefined,
        null,
      ]
    )(`should not throw an error if ${field} is empty (%s)`, async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditClientInputDto);
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
      expect(result).toBeInstanceOf(EditClientInputDto);
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
      kind: 'kind',
      cnpj: 'cnpj',
      ie: 'ie',
      group: 'group',
      type: 'type',
      generateInvoice: true,
      companyName: 'companyName',
      fantasyName: 'fantasyName',
      owner: 'owner',
      headquarters: 'headquarters',
      companyIds: ['companyId', 'companyId2'],
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditClientInputDto);
    expect(result).toEqual(data);
  });
});
