import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { FindAllAddressQueryDto } from './find-all-address.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: FindAllAddressQueryDto,
};

describe('FindAllAddressQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      'ownerId',
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

  describe.each(
    [
      'ownerId',
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
    )(`should throw an error if ${field} is not a string (%s)`, async(value: any) => {
      const data = { [field]: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser uma string`);
      });
    });
  });

  it('should pass if all fields are valid', async() => {
    const data = {
      isMain: true,
      ownerId: 'owner-123',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(FindAllAddressQueryDto);
    expect(result).toEqual({ ownerId: data.ownerId });
  });
});
