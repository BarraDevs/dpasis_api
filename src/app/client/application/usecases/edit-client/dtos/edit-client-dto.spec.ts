import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
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
        '',
        '  ',
      ]
    )(`should throw an error if ${field} is empty (%s)`, async(value: any) => {
      const data = { [field]: value };

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
      const data = { [field]: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser uma string`);
      });
    });

    it(`should throw an error if ${field} exceeds maximum length`, async() => {
      const data = { [field]: 'a'.repeat(257) };

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
        '',
        '  ',
      ]
    )(`should throw an error if ${field} is empty (%s)`, async(value: any) => {
      const data = { [field]: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} é obrigatório`);
      });
    });
  });

  it('should pass if all fields are valid', async() => {
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
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditClientInputDto);
    expect(result).toEqual(data);
  });
});
