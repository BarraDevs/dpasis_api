import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { BankSlipProvider } from '../../enums/bank-slip-provider.enum';
import { BankSlipProviderNotSupportedError } from '../../errors/bank-slip-provider-not-supported.error';
import type { IBankSlipGenerationStrategy } from '../../strategies/bank-slip-generation.strategy';
import { BankSlipGenerationStrategyAdapterGateway } from './bank-slip-generation-strategy.gateway';

describe('BankSlipGenerationStrategyAdapterGateway - Unit tests', () => {
  let sut: BankSlipGenerationStrategyAdapterGateway;
  let interStrategy: IBankSlipGenerationStrategy;

  beforeEach(async() => {
    interStrategy = createMock<IBankSlipGenerationStrategy>({
      provider: BankSlipProvider.INTER,
      issue: jest.fn().mockResolvedValue({
        provider: BankSlipProvider.INTER,
        externalId: 'inter-stub',
      }),
    });

    const module = await Test.createTestingModule({
      providers: [
        BankSlipGenerationStrategyAdapterGateway,
        {
          provide: TOKENS.BankSlipGenerationStrategies,
          useValue: [interStrategy],
        },
      ],
    }).compile();

    sut = module.get(BankSlipGenerationStrategyAdapterGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should delegate issue to matching strategy', async() => {
    // Arrange
    const input = { provider: BankSlipProvider.INTER };

    // Act
    const result = await sut.issue(input);

    // Assert
    expect(interStrategy.issue).toHaveBeenCalledWith(input);
    expect(result).toEqual({
      provider: BankSlipProvider.INTER,
      externalId: 'inter-stub',
    });
  });

  it('should throw BankSlipProviderNotSupportedError when provider is unknown', async() => {
    // Arrange
    const input = { provider: 'UNKNOWN' as BankSlipProvider };

    // Act
    const promise = sut.issue(input);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(BankSlipProviderNotSupportedError);
    await expect(promise).rejects.toMatchObject({
      message: 'Provedor de boleto não suportado: UNKNOWN.',
    });
  });
});
