import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { GenerateVoucherInputDto } from './generate-voucher.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: GenerateVoucherInputDto,
};

function makeValidInputDto(overrides: Partial<GenerateVoucherInputDto> = {}): GenerateVoucherInputDto {
  return {
    id: 1,
    ...overrides,
  };
}

describe('GenerateVoucherInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('id field', () => {
    it.each([
      undefined,
      null,
    ])('should throw an error if id is missing (%s)', async(value: any) => {
      const data = makeValidInputDto({ id: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toBeDefined();
      });
    });

    it.each([
      0,
      -1,
    ])('should throw an error if id is not positive (%s)', async(value: number) => {
      const data = makeValidInputDto({ id: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('id deve ser um inteiro positivo');
      });
    });

    it('should throw an error if id is not an integer', async() => {
      const data = makeValidInputDto({ id: 1.5 as unknown as number });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('id deve ser um número inteiro');
      });
    });

    it('should accept valid id', async() => {
      const data = makeValidInputDto({ id: 99 });

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(GenerateVoucherInputDto);
      expect(result.id).toBe(99);
    });
  });
});
