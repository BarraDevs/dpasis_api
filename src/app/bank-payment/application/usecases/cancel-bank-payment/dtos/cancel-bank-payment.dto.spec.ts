import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { BankPaymentCancelReason } from 'src/infra/bank-payment/enums/bank-payment-cancel-reason.enum';
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
      reason: BankPaymentCancelReason.CUSTOMER_REQUEST,
    }, metadata);

    expect(result.reason).toBe(BankPaymentCancelReason.CUSTOMER_REQUEST);
  });

  it('should reject invalid reason', async() => {
    expect.assertions(1);
    return target.transform({
      provider: BankPaymentProvider.INTER,
      reason: 'INVALID',
    }, metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'reason');
    });
  });
});
