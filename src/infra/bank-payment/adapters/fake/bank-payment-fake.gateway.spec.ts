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
    // Arrange
    const input = { provider: BankPaymentProvider.INTER };

    // Act
    const result = await sut.issue(input);

    // Assert
    expect(sut.issueCalls).toEqual([input]);
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      externalId: 'fake-external-id',
    });
  });

  it('should reject when issueError is set', async() => {
    // Arrange
    const error = new Error('fake failure');
    sut.issueError = error;
    const input = { provider: BankPaymentProvider.INTER };

    // Act
    const promise = sut.issue(input);

    // Assert
    await expect(promise).rejects.toBe(error);
    expect(sut.issueCalls).toEqual([input]);
  });
});
