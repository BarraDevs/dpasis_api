import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CancelNfmInputDto } from './cancel-nfm.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CancelNfmInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some(m => m.includes(substring))).toBe(true);
}

function makeValidInputDto(overrides: Partial<CancelNfmInputDto> = {}): CancelNfmInputDto {
  return {
    cancelReasonCode: 2,
    ...overrides,
  };
}

describe('CancelNfmInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept a valid input', async() => {
    const result = await target.transform(makeValidInputDto(), metadata);

    expect(result.cancelReasonCode).toBe(2);
  });

  describe('cancelReasonCode', () => {
    it.each([1, 2, 4])('should accept valid cancelReasonCode %s', async(code) => {
      const result = await target.transform(makeValidInputDto({ cancelReasonCode: code }), metadata);

      expect(result.cancelReasonCode).toBe(code);
    });

    it.each([undefined, null])('should reject missing cancelReasonCode (%s)', async(value: unknown) => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ cancelReasonCode: value as number }), metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'cancelReasonCode');
      });
    });

    it.each([3, 5, 0, -1, 99])('should reject invalid cancelReasonCode %s', async(code) => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ cancelReasonCode: code }), metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'cancelReasonCode deve ser 1, 2 ou 4');
      });
    });

    it('should reject non-numeric cancelReasonCode', async() => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ cancelReasonCode: 'abc' as unknown as number }), metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'cancelReasonCode');
      });
    });
  });
});
