import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindBankPaymentQueryDto } from './find-bank-payment.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindBankPaymentQueryDto,
};

describe('FindBankPaymentQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept provider and bankId', async() => {
    const result = await target.transform({
      provider: BankPaymentProvider.INTER,
      bankId: '12',
    }, metadata);
    expect(result.provider).toBe(BankPaymentProvider.INTER);
    expect(result.bankId).toBe(12);
  });

  it('should reject missing bankId', async() => {
    expect.assertions(1);
    return target.transform({ provider: BankPaymentProvider.INTER }, metadata).catch((error) => {
      const messages = error.getResponse().message as string[];
      expect(messages.some((message) => message.includes('bankId'))).toBe(true);
    });
  });
});
