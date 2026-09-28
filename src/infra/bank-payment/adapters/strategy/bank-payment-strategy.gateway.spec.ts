import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentPersonType } from '../../enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from '../../enums/bank-payment-provider.enum';
import { BankPaymentStatus } from '../../enums/bank-payment-status.enum';
import { BankPaymentProviderNotSupportedError } from '../../errors/bank-payment-provider-not-supported.error';
import type { IBankPaymentStrategy } from '../../strategies/bank-payment.strategy';
import { BankPaymentStrategyAdapterGateway } from './bank-payment-strategy.gateway';
import { makeBankPaymentCredentials } from 'src/test/fixtures/bank-payment-credentials';

describe('BankPaymentStrategyAdapterGateway - Unit tests', () => {
  let sut: BankPaymentStrategyAdapterGateway;
  let interStrategy: IBankPaymentStrategy;

  beforeEach(async() => {
    interStrategy = createMock<IBankPaymentStrategy>({
      provider: BankPaymentProvider.INTER,
      issue: jest.fn().mockResolvedValue({
        provider: BankPaymentProvider.INTER,
        requestCode: 'req-1' }),
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
      list: jest.fn().mockResolvedValue({
        items: [],
        total: 0,
      }),
      cancel: jest.fn().mockResolvedValue(undefined),
      getPdf: jest.fn().mockResolvedValue({
        provider: BankPaymentProvider.INTER,
        requestCode: 'req-1',
        pdf: 'JVBERi0xLjQK' }),
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
      credentials: makeBankPaymentCredentials(),
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
      requestCode: 'req-1' });
  });

  it('should delegate find, getPdf and cancel', async() => {
    // Arrange
    const findInput = { provider: BankPaymentProvider.INTER, requestCode: 'req-1', credentials: makeBankPaymentCredentials() };
    const getPdfInput = { provider: BankPaymentProvider.INTER, requestCode: 'req-1', credentials: makeBankPaymentCredentials() };
    const cancelInput = {
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-1',
      reason: 'Cliente pediu o cancelamento',
      credentials: makeBankPaymentCredentials(),
    };

    // Act
    await sut.find(findInput);
    await sut.getPdf(getPdfInput);
    await sut.cancel(cancelInput);

    // Assert
    expect(interStrategy.find).toHaveBeenCalledWith(findInput);
    expect(interStrategy.getPdf).toHaveBeenCalledWith(getPdfInput);
    expect(interStrategy.cancel).toHaveBeenCalledWith(cancelInput);
  });

  it('should delegate list to matching strategy', async() => {
    const listInput = {
      provider: BankPaymentProvider.INTER,
      credentials: makeBankPaymentCredentials(),
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    };
    (interStrategy.list as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
    });

    const result = await sut.list(listInput);

    expect(interStrategy.list).toHaveBeenCalledWith(listInput);
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('should throw BankPaymentProviderNotSupportedError when provider is unknown', async() => {
    const input = {
      provider: 'UNKNOWN' as BankPaymentProvider,
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

    const promise = sut.issue(input);

    await expect(promise).rejects.toBeInstanceOf(BankPaymentProviderNotSupportedError);
    await expect(promise).rejects.toMatchObject({
      message: 'Provedor bancário não suportado: UNKNOWN.',
    });
  });
});
