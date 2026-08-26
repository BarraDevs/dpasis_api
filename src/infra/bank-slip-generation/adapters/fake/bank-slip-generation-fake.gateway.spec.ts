import { BankSlipProvider } from '../../enums/bank-slip-provider.enum';
import { BankSlipGenerationFakeAdapterGateway } from './bank-slip-generation-fake.gateway';

describe('BankSlipGenerationFakeAdapterGateway - Unit tests', () => {
  let sut: BankSlipGenerationFakeAdapterGateway;

  beforeEach(() => {
    sut = new BankSlipGenerationFakeAdapterGateway();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should record issue calls and return default result', async() => {
    // Arrange
    const input = { provider: BankSlipProvider.INTER };

    // Act
    const result = await sut.issue(input);

    // Assert
    expect(sut.issueCalls).toEqual([input]);
    expect(result).toEqual({
      provider: BankSlipProvider.INTER,
      externalId: 'fake-external-id',
    });
  });

  it('should reject when issueError is set', async() => {
    // Arrange
    const error = new Error('fake failure');
    sut.issueError = error;
    const input = { provider: BankSlipProvider.INTER };

    // Act
    const promise = sut.issue(input);

    // Assert
    await expect(promise).rejects.toBe(error);
    expect(sut.issueCalls).toEqual([input]);
  });
});
