import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { ReissueBankPaymentByNfmIdInputDto } from './reissue-bank-payment-by-nfm-id.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: ReissueBankPaymentByNfmIdInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some(m => m.includes(substring))).toBe(true);
}

function makeValidInputDto(overrides: Partial<ReissueBankPaymentByNfmIdInputDto> = {}): ReissueBankPaymentByNfmIdInputDto {
  return {
    reason: 'Inter reportou FALHA_EMISSAO; reemissão autorizada pelo financeiro',
    confirm: true,
    ...overrides,
  };
}

describe('ReissueBankPaymentByNfmIdInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept a valid input', async() => {
    const result = await target.transform(makeValidInputDto(), metadata);

    expect(result).toMatchObject({ confirm: true });
  });

  describe('reason', () => {
    it.each([undefined, null, ''])('should reject a missing reason (%s)', async(value: unknown) => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ reason: value as string }), metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'reason');
      });
    });

    it('should reject a reason that explains nothing', async() => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ reason: 'ok' }), metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'reason deve descrever o motivo');
      });
    });

    it('should reject a reason longer than 500 characters', async() => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ reason: 'a'.repeat(501) }), metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'reason');
      });
    });
  });

  describe('confirm', () => {
    it('should reject confirm=false — reissuing creates a new charge at the bank', async() => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ confirm: false }), metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'confirm deve ser true');
      });
    });

    it('should reject a missing confirm', async() => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ confirm: undefined as unknown as boolean }), metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'confirm');
      });
    });
  });
});
