import { BankPaymentProvider } from '../../enums/bank-payment-provider.enum';
import { BankPaymentInterStrategy } from './bank-payment-inter.strategy';

describe('BankPaymentInterStrategy - Unit tests', () => {
  let sut: BankPaymentInterStrategy;

  beforeEach(() => {
    sut = new BankPaymentInterStrategy();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should expose INTER as provider', () => {
    expect(sut.provider).toBe(BankPaymentProvider.INTER);
  });

  it('should return stub output on issue', async() => {
    // Arrange
    const input = { provider: BankPaymentProvider.INTER };

    // Act
    const result = await sut.issue(input);

    // Assert
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      externalId: 'inter-stub',
    });
  });
});
