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

  it('should return findResult with requestCode from input', async() => {
    // Arrange
    const input = { provider: BankPaymentProvider.INTER, requestCode: 'abc' };

    // Act
    const result = await sut.find(input);

    // Assert
    expect(result.requestCode).toBe('abc');
    expect(result.yourNumber).toBe(sut.findResult.yourNumber);
  });

  it('should reject when findError is set', async() => {
    // Arrange
    const error = new Error('fake find failure');
    sut.findError = error;

    // Act / Assert
    await expect(sut.find({
      provider: BankPaymentProvider.INTER,
      requestCode: 'abc',
    })).rejects.toBe(error);
  });

  it('should reject when cancelError is set', async() => {
    // Arrange
    const error = new Error('fake cancel failure');
    sut.cancelError = error;

    // Act / Assert
    await expect(sut.cancel({
      provider: BankPaymentProvider.INTER,
      requestCode: 'abc',
      reason: 'Cliente pediu o cancelamento',
    })).rejects.toBe(error);
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
