import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { Params } from './params.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: Params,
};

describe('Params', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      'id',
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
        () => {},
        Symbol('test'),
        BigInt(123),
        new Date(),
        [1, 2, 3],
        { key: 'value' },
        new Map(),
        new Set(),
        Buffer.from('test'),
        new ArrayBuffer(8),
        new Int32Array(8),
      ]
    )(`should throw an error if ${field} is not a string (%s)`, async(value: any) => {
      const data = { [field]: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser um texto`);
      });
    });
  });

  it('should pass if all fields are valid', async() => {
    const data = {
      id: '  random - - id  ',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(Params);
    expect(result).toEqual({ id: 'random - - id' });
  });
});
