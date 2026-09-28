import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CancelBankPaymentInputDto } from './cancel-bank-payment.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CancelBankPaymentInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some(m => m.includes(substring))).toBe(true);
}

describe('CancelBankPaymentInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept a valid input', async() => {
    const result = await target.transform({
      provider: BankPaymentProvider.INTER,
      bankId: 1,
      reason: 'Cliente pediu o cancelamento',
    }, metadata);

    expect(result.reason).toBe('Cliente pediu o cancelamento');
  });

  it('should trim reason', async() => {
    const result = await target.transform({
      provider: BankPaymentProvider.INTER,
      bankId: 1,
      reason: '  Cliente pediu o cancelamento  ',
    }, metadata);

    expect(result.reason).toBe('Cliente pediu o cancelamento');
  });

  it('should reject empty reason', async() => {
    expect.assertions(1);
    return target.transform({
      provider: BankPaymentProvider.INTER,
      bankId: 1,
      reason: '   ',
    }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'reason');
    });
  });

  it('should reject non-string reason', async() => {
    expect.assertions(1);
    return target.transform({
      provider: BankPaymentProvider.INTER,
      bankId: 1,
      reason: 123,
    }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'reason');
    });
  });

  it('should reject reason longer than 50 characters', async() => {
    expect.assertions(1);
    return target.transform({
      provider: BankPaymentProvider.INTER,
      bankId: 1,
      reason: 'a'.repeat(51),
    }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'reason');
    });
  });

  it('should reject missing bankId', async() => {
    expect.assertions(1);
    return target.transform({
      provider: BankPaymentProvider.INTER,
      reason: 'Cliente pediu o cancelamento',
    }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'bankId');
    });
  });
});
