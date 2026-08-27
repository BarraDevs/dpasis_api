import { BankPaymentPersonType } from '../../enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from '../../enums/bank-payment-provider.enum';
import { BankPaymentFakeAdapterGateway } from './bank-payment-fake.gateway';

describe('BankPaymentFakeAdapterGateway - Unit tests', () => {
  let sut: BankPaymentFakeAdapterGateway;

  beforeEach(() => {
    sut = new BankPaymentFakeAdapterGateway();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should record issue calls and return default result', async() => {
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

    expect(sut.issueCalls).toEqual([input]);
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'fake-request-code',
    });
  });

  it('should record find and cancel calls', async() => {
    await sut.find({ provider: BankPaymentProvider.INTER, requestCode: 'abc' });
    await sut.cancel({
      provider: BankPaymentProvider.INTER,
      requestCode: 'abc',
      reason: 'Cliente pediu o cancelamento',
    });

    expect(sut.findCalls).toHaveLength(1);
    expect(sut.cancelCalls).toHaveLength(1);
  });

  it('should record getPdf calls and return default result', async() => {
    const result = await sut.getPdf({
      provider: BankPaymentProvider.INTER,
      requestCode: 'abc',
    });

    expect(sut.getPdfCalls).toEqual([{
      provider: BankPaymentProvider.INTER,
      requestCode: 'abc',
    }]);
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'abc',
      pdf: 'JVBERi0xLjQK',
    });
  });

  it('should reject when getPdfError is set', async() => {
    const error = new Error('fake pdf failure');
    sut.getPdfError = error;

    await expect(sut.getPdf({
      provider: BankPaymentProvider.INTER,
      requestCode: 'abc',
    })).rejects.toBe(error);
  });

  it('should reject when issueError is set', async() => {
    const error = new Error('fake failure');
    sut.issueError = error;

    await expect(sut.issue({
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
    })).rejects.toBe(error);
  });
});
