import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { ParamsHexId } from './params-hex-id.dto';

const metadata: ArgumentMetadata = {
  type: 'param',
  metatype: ParamsHexId,
};

describe('ParamsHexId DTO', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('id field', () => {
    it.each([
      undefined,
      null,
      '',
    ])('should throw if id is empty (%s)', async(value: unknown) => {
      const data = { id: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('id é obrigatório');
      });
    });

    it('should throw if id is only whitespace after trim', async() => {
      const data = { id: '   ' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('id é obrigatório');
      });
    });

    it.each([
      ['43', '43'],
      ['0x43', '0x43'],
      ['FF', 'FF'],
      ['ff', 'ff'],
      ['1', '1'],
      ['ffffffff', 'ffffffff'],
    ])('should accept valid hex string (%s)', async(raw: string, expectedAfterTrim: string) => {
      const data = { id: raw };

      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(ParamsHexId);
      expect(result.id).toBe(expectedAfterTrim);
    });

    it('should trim whitespace around id', async() => {
      const data = { id: '  AB  ' };

      const result = await target.transform(data, metadata);
      expect(result).toBeInstanceOf(ParamsHexId);
      expect(result.id).toBe('AB');
    });

    it('should reject non-string id', async() => {
      const data = { id: 43 };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message as string[];
        expect(message).toContain('id deve ser uma string');
      });
    });

    it.each([
      'GG',
      '123456789',
      '-1',
    ])('should reject invalid hex id (%s)', async(value: string) => {
      const data = { id: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message as string[];
        expect(message.some((m) => m.includes('hexadecimal'))).toBe(true);
      });
    });
  });
});
