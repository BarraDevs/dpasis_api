import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentCancelReason } from '../../enums/bank-payment-cancel-reason.enum';
import { BankPaymentPersonType } from '../../enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from '../../enums/bank-payment-provider.enum';
import { BankPaymentStatus } from '../../enums/bank-payment-status.enum';
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

    expect(interStrategy.issue).toHaveBeenCalledWith(input);
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-1',
    });
  });

  it('should delegate find and cancel', async() => {
    await sut.find({ provider: BankPaymentProvider.INTER, requestCode: 'req-1' });
    await sut.cancel({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-1',
      reason: BankPaymentCancelReason.CUSTOMER_REQUEST,
    });

    expect(interStrategy.find).toHaveBeenCalled();
    expect(interStrategy.cancel).toHaveBeenCalled();
  });

  it('should throw BankPaymentProviderNotSupportedError when provider is unknown', async() => {
    const input = {
      provider: 'UNKNOWN' as BankPaymentProvider,
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

    const promise = sut.issue(input);

    await expect(promise).rejects.toBeInstanceOf(BankPaymentProviderNotSupportedError);
    await expect(promise).rejects.toMatchObject({
      message: 'Provedor bancário não suportado: UNKNOWN.',
    });
  });
});
