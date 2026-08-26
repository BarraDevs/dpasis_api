import { BankSlipGenerationInterStrategy } from './bank-slip-generation-inter.strategy';
import { BankSlipProvider } from '../../enums/bank-slip-provider.enum';

describe('BankSlipGenerationInterStrategy - Unit tests', () => {
  let sut: BankSlipGenerationInterStrategy;

  beforeEach(() => {
    sut = new BankSlipGenerationInterStrategy();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should expose INTER as provider', () => {
    expect(sut.provider).toBe(BankSlipProvider.INTER);
  });

  it('should return stub output on issue', async() => {
    // Arrange
    const input = { provider: BankSlipProvider.INTER };

    // Act
    const result = await sut.issue(input);

    // Assert
    expect(result).toEqual({
      provider: BankSlipProvider.INTER,
      externalId: 'inter-stub',
    });
  });
});
