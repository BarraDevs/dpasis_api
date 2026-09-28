import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllBankPaymentQueryDto } from './find-all-bank-payment.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllBankPaymentQueryDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some(m => m.includes(substring))).toBe(true);
}

function makeValidQuery(overrides: Partial<FindAllBankPaymentQueryDto> = {}): FindAllBankPaymentQueryDto {
  return {
    bankId: 1,
    provider: BankPaymentProvider.INTER,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    ...overrides,
  };
}

describe('FindAllBankPaymentQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept a valid query', async() => {
    const result = await target.transform(makeValidQuery({
      status: BankPaymentStatus.EMITTED,
      payerName: 'João',
      payerDocument: '11122233344',
      page: '1',
      size: '50',
    } as never), metadata);

    expect(result.provider).toBe(BankPaymentProvider.INTER);
    expect(result.startDate).toBe('2026-01-01');
    expect(result.endDate).toBe('2026-01-31');
    expect(result.status).toBe(BankPaymentStatus.EMITTED);
    expect(result.payerName).toBe('João');
    expect(result.payerDocument).toBe('11122233344');
    expect(result.page).toBe(1);
    expect(result.size).toBe(50);
  });

  it('should reject missing startDate', async() => {
    expect.assertions(1);
    return target.transform(makeValidQuery({ startDate: undefined }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'startDate');
    });
  });

  it('should reject invalid endDate format', async() => {
    expect.assertions(1);
    return target.transform(makeValidQuery({ endDate: '31/01/2026' }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'endDate');
    });
  });

  it('should reject invalid provider', async() => {
    expect.assertions(1);
    return target.transform(makeValidQuery({ provider: 'OTHER' as BankPaymentProvider }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'provider');
    });
  });

  it('should reject invalid status', async() => {
    expect.assertions(1);
    return target.transform(makeValidQuery({ status: 'OTHER' as BankPaymentStatus }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'status');
    });
  });

  it('should reject missing bankId', async() => {
    expect.assertions(1);
    return target.transform(makeValidQuery({ bankId: undefined }), metadata).catch((error) => {
      expectMessageToContain(error.getResponse().message, 'bankId');
    });
  });
});
