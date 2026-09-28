import { BankPaymentPersonType } from '../../enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from '../../enums/bank-payment-provider.enum';
import { BankPaymentFakeAdapterGateway } from './bank-payment-fake.gateway';
import { makeBankPaymentCredentials } from 'src/test/fixtures/bank-payment-credentials';

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
      credentials: makeBankPaymentCredentials(),
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
      requestCode: 'fake-request-code' });
  });

  it('should record find and cancel calls', async() => {
    await sut.find({ provider: BankPaymentProvider.INTER, requestCode: 'abc', credentials: makeBankPaymentCredentials() });
    await sut.cancel({
      provider: BankPaymentProvider.INTER,
      requestCode: 'abc',
      reason: 'Cliente pediu o cancelamento',
      credentials: makeBankPaymentCredentials(),
    });

    expect(sut.findCalls).toHaveLength(1);
    expect(sut.cancelCalls).toHaveLength(1);
  });

  it('should record list calls and return default result', async() => {
    const input = {
      provider: BankPaymentProvider.INTER,
      credentials: makeBankPaymentCredentials(),
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    };

    const result = await sut.list(input);

    expect(sut.listCalls).toEqual([input]);
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].requestCode).toBe('fake-request-code');
  });

  it('should reject when listError is set', async() => {
    const error = new Error('fake list failure');
    sut.listError = error;

    await expect(sut.list({
      provider: BankPaymentProvider.INTER,
      credentials: makeBankPaymentCredentials(),
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    })).rejects.toBe(error);
  });

  it('should return findResult with requestCode from input', async() => {
    // Arrange
    const input = { provider: BankPaymentProvider.INTER, requestCode: 'abc', credentials: makeBankPaymentCredentials() };

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
      requestCode: 'abc', credentials: makeBankPaymentCredentials() })).rejects.toBe(error);
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
      credentials: makeBankPaymentCredentials(),
    })).rejects.toBe(error);
  });

  it('should record getPdf calls and return default result', async() => {
    const result = await sut.getPdf({
      provider: BankPaymentProvider.INTER,
      requestCode: 'abc', credentials: makeBankPaymentCredentials() });

    expect(sut.getPdfCalls).toEqual([{
      provider: BankPaymentProvider.INTER,
      requestCode: 'abc', credentials: makeBankPaymentCredentials() }]);
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'abc',
      pdf: 'JVBERi0xLjQK' });
  });

  it('should reject when getPdfError is set', async() => {
    const error = new Error('fake pdf failure');
    sut.getPdfError = error;

    await expect(sut.getPdf({
      provider: BankPaymentProvider.INTER,
      requestCode: 'abc', credentials: makeBankPaymentCredentials() })).rejects.toBe(error);
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
      credentials: makeBankPaymentCredentials(),
      payer: {
        document: '1',
        personType: BankPaymentPersonType.INDIVIDUAL,
        name: 'A',
      },
    })).rejects.toBe(error);
  });
});
