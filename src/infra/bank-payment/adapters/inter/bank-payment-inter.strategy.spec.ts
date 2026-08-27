import { createMock } from '@golevelup/ts-jest';
import { BankPaymentPersonType } from '../../enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from '../../enums/bank-payment-provider.enum';
import { BankPaymentStatus } from '../../enums/bank-payment-status.enum';
import { InterCobrancaClient } from './cobranca/inter-cobranca.client';
import { BankPaymentInterStrategy } from './bank-payment-inter.strategy';

describe('BankPaymentInterStrategy - Unit tests', () => {
  let sut: BankPaymentInterStrategy;
  let cobrancaClient: jest.Mocked<InterCobrancaClient>;

  beforeEach(() => {
    cobrancaClient = createMock<InterCobrancaClient>({
      issue: jest.fn().mockResolvedValue({
        provider: BankPaymentProvider.INTER,
        requestCode: 'req-1',
      }),
      find: jest.fn().mockResolvedValue({
        provider: BankPaymentProvider.INTER,
        requestCode: 'req-1',
        yourNumber: 'INV-1',
        status: BankPaymentStatus.EMITTED,
        amount: 10,
        dueDate: '2026-09-01',
        payer: {
          document: '1',
          personType: BankPaymentPersonType.INDIVIDUAL,
          name: 'A',
        },
      }),
      cancel: jest.fn().mockResolvedValue(undefined),
    });
    sut = new BankPaymentInterStrategy(cobrancaClient);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should expose INTER as provider', () => {
    expect(sut.provider).toBe(BankPaymentProvider.INTER);
  });

  it('should delegate issue to cobranca client', async() => {
    const input = {
      provider: BankPaymentProvider.INTER,
      yourNumber: 'INV-1',
      amount: 10,
      dueDate: '2026-09-01',
      daysAfterDue: 30,
      payer: {
        document: '1',
        personType: BankPaymentPersonType.INDIVIDUAL,
        name: 'A',
      },
    };

    const result = await sut.issue(input);

    expect(cobrancaClient.issue).toHaveBeenCalledWith(input);
    expect(result.requestCode).toBe('req-1');
  });

  it('should delegate find to cobranca client', async() => {
    const input = { provider: BankPaymentProvider.INTER, requestCode: 'req-1' };
    await sut.find(input);
    expect(cobrancaClient.find).toHaveBeenCalledWith(input);
  });

  it('should delegate getPdf to cobranca client', async() => {
    const input = { provider: BankPaymentProvider.INTER, requestCode: 'req-1' };
    cobrancaClient.getPdf = jest.fn().mockResolvedValue({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-1',
      pdf: 'JVBERi0xLjQK',
    });

    const result = await sut.getPdf(input);

    expect(cobrancaClient.getPdf).toHaveBeenCalledWith(input);
    expect(result.pdf).toBe('JVBERi0xLjQK');
  });

  it('should delegate cancel to cobranca client', async() => {
    const input = {
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-1',
      reason: 'Cliente pediu o cancelamento',
    };
    await sut.cancel(input);
    expect(cobrancaClient.cancel).toHaveBeenCalledWith(input);
  });
});
