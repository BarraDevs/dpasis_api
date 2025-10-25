import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { FindAllClientQueryDto } from './find-all-client.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: FindAllClientQueryDto,
};

describe('FindAllClientQueryDto', () => {
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
      const data = { [field]: value };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(FindAllClientQueryDto);
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
        expect(error.getResponse().message).toContain(`${field} deve ser um texto`);
      });
    });
  });

  it('should pass if all fields are valid', async() => {
    const data = {
      companyName: 'Empresa XYZ',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(FindAllClientQueryDto);
    expect(result).toEqual(data);
  });
});
