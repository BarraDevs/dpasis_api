import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentProvider } from '../../enums/bank-payment-provider.enum';
import { BankPaymentProviderNotSupportedError } from '../../errors/bank-payment-provider-not-supported.error';
import type { IBankPaymentStrategy } from '../../strategies/bank-payment.strategy';
import { BankPaymentStrategyAdapterGateway } from './bank-payment-strategy.gateway';

describe('BankPaymentStrategyAdapterGateway - Unit tests', () => {
  let sut: BankPaymentStrategyAdapterGateway;
  let interStrategy: IBankPaymentStrategy;

  beforeEach(async() => {
    interStrategy = createMock<IBankPaymentStrategy>({
      provider: BankPaymentProvider.INTER,
      issue: jest.fn().mockResolvedValue({
        provider: BankPaymentProvider.INTER,
        externalId: 'inter-stub',
      }),
    });

    const module = await Test.createTestingModule({
      providers: [
        BankPaymentStrategyAdapterGateway,
        {
          provide: TOKENS.BankPaymentStrategies,
          useValue: [interStrategy],
        },
      ],
    }).compile();

    sut = module.get(BankPaymentStrategyAdapterGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should delegate issue to matching strategy', async() => {
    // Arrange
    const input = { provider: BankPaymentProvider.INTER };

    // Act
    const result = await sut.issue(input);

    // Assert
    expect(interStrategy.issue).toHaveBeenCalledWith(input);
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      externalId: 'inter-stub',
    });
  });

  it('should throw BankPaymentProviderNotSupportedError when provider is unknown', async() => {
    // Arrange
    const input = { provider: 'UNKNOWN' as BankPaymentProvider };

    // Act
    const promise = sut.issue(input);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(BankPaymentProviderNotSupportedError);
    await expect(promise).rejects.toMatchObject({
      message: 'Provedor bancário não suportado: UNKNOWN.',
    });
  });
});
