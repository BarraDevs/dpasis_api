import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FindBankPayment } from 'src/app/bank-payment/application/usecases/find-bank-payment/find-bank-payment.service';
import { IssueBankPayment } from 'src/app/bank-payment/application/usecases/issue-bank-payment/issue-bank-payment.service';
import { ClientInvoiceConfigDto } from 'src/app/client/client-invoice-config/application/dtos/client-invoice-config.dto';
import { FindClientInvoiceConfigByClientId } from 'src/app/client/client-invoice-config/application/usecases/find-client-invoice-config-by-client-id/find-client-invoice-config-by-client-id.service';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceConfigNotFoundError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-not-found.error';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { TOKENS } from 'src/core/di/token';
import { AppException } from 'src/core/filters/app.exception';
import { BankPaymentDto } from 'src/infra/bank-payment/dtos/bank-payment.dto';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentAlreadyExistsError } from 'src/infra/bank-payment/errors/bank-payment-already-exists.error';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfseProps } from '../../../domain/entities/nfse.entity';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseFactory } from '../../../domain/factories/nfse.factory';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import type { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ProcessIssueNfseBankPayment } from './process-issue-nfse-bank-payment.service';

function makeSnapshot(overrides: Partial<NfseIssueSnapshot> = {}): NfseIssueSnapshot {
  return {
    input: {
      companyId: 1,
      clientId: 1,
      simpleNationalOptant: false,
      fiscalIncentive: false,
      service: {
        serviceListItemCode: '01.07',
        nbsCode: '1.1501.30.00',
        indopCode: '050101',
        description: 'Serviço',
        serviceMunicipalCodeIbge: '3529401',
        issExigibility: 1,
        issWithheld: false,
        servicesValue: 1000,
      },
    },
    providerDocument: '12345678000199',
    providerMunicipalRegistration: '12345',
    clientDocument: '11122233344',
    clientCompanyName: 'Cliente PF',
    clientType: ClientType.PF,
    takerAddress: {
      street: 'Rua A',
      number: '10',
      neighborhood: 'Centro',
      city: 'São Paulo',
      cityCodeIbge: '3550308',
      state: 'SP',
      zipCode: '01310100',
    },
    bankPayment: {
      invoiceType: ClientInvoiceConfigType.MONTHLY,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      dueDateDay: 15,
      dueMonth: null,
      deadlineDays: null,
      referenceMonth: 8,
      referenceYear: 2026,
    },
    ...overrides,
  };
}

function makeInvoiceConfig(overrides: Partial<ClientInvoiceConfigDto> = {}): ClientInvoiceConfigDto {
  return createMock<ClientInvoiceConfigDto>({
    type: ClientInvoiceConfigType.MONTHLY,
    dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
    dueDateDay: 15,
    dueMonth: null,
    deadlineDays: null,
    ...overrides,
  });
}

function makeNfseProps(overrides: Partial<NfseProps> = {}): NfseProps {
  return {
    id: 1,
    companyId: 1,
    clientId: 1,
    rpsNumber: 1,
    rpsSeries: 'NFSE',
    status: NfseStatus.ISSUED,
    batchProtocol: 'protocol-1',
    nfseNumber: '1000',
    verificationCode: 'ABC',
    issuedAt: new Date('2026-08-20T12:00:00-03:00'),
    errorMessage: null,
    canceledAt: null,
    cancelReasonCode: null,
    bankPaymentProvider: null,
    bankPaymentRequestCode: null,
    data: makeSnapshot() as unknown as Record<string, unknown>,
    ...overrides,
  };
}

describe('ProcessIssueNfseBankPayment - Unit tests', () => {
  let sut: ProcessIssueNfseBankPayment;
  let logger: ILoggerGateway;
  let nfseRepository: INfseRepository;
  let issueBankPayment: IssueBankPayment;
  let findBankPayment: FindBankPayment;
  let findClientInvoiceConfigByClientId: FindClientInvoiceConfigByClientId;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ProcessIssueNfseBankPayment,
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: TOKENS.NfseRepository, useValue: createMock<INfseRepository>() },
        { provide: IssueBankPayment, useValue: createMock<IssueBankPayment>() },
        { provide: FindBankPayment, useValue: createMock<FindBankPayment>() },
        { provide: FindClientInvoiceConfigByClientId, useValue: createMock<FindClientInvoiceConfigByClientId>() },
      ],
    }).compile();

    sut = module.get(ProcessIssueNfseBankPayment);
    logger = module.get(TOKENS.LoggerGateway);
    nfseRepository = module.get(TOKENS.NfseRepository);
    issueBankPayment = module.get(IssueBankPayment);
    findBankPayment = module.get(FindBankPayment);
    findClientInvoiceConfigByClientId = module.get(FindClientInvoiceConfigByClientId);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfseNotFoundError when nfse does not exist', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(NfseNotFoundError);
  });

  it('should be a no-op when nfse is not ISSUED', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(
      NfseFactory.load(makeNfseProps({ status: NfseStatus.PENDING, nfseNumber: null, issuedAt: null })),
    );

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(result).toBeNull();
    expect(issueBankPayment.execute).not.toHaveBeenCalled();
    expect(nfseRepository.edit).not.toHaveBeenCalled();
  });

  it('should be a no-op when nfse is CANCELED', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(
      NfseFactory.load(makeNfseProps({
        status: NfseStatus.CANCELED,
        canceledAt: new Date('2026-08-21T12:00:00-03:00'),
        cancelReasonCode: 1,
      })),
    );

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(result).toBeNull();
    expect(issueBankPayment.execute).not.toHaveBeenCalled();
    expect(nfseRepository.edit).not.toHaveBeenCalled();
  });

  it('should be a no-op when bank payment is already linked', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(
      NfseFactory.load(makeNfseProps({
        bankPaymentProvider: BankPaymentProvider.INTER,
        bankPaymentRequestCode: 'already-there',
      })),
    );

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(result).toBeNull();
    expect(issueBankPayment.execute).not.toHaveBeenCalled();
    expect(nfseRepository.edit).not.toHaveBeenCalled();
  });

  it('should issue bank payment and persist provider/requestCode', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(issueBankPayment, 'execute').mockResolvedValue({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-123',
    });

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-123',
    });
    expect(issueBankPayment.execute).toHaveBeenCalledWith(expect.objectContaining({
      provider: BankPaymentProvider.INTER,
      yourNumber: '1',
      amount: 1000,
    }));
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(nfse.props).toMatchObject({
      bankPaymentProvider: BankPaymentProvider.INTER,
      bankPaymentRequestCode: 'req-123',
    });
  });

  it('should load bankPayment from invoice config fallback when snapshot lacks it', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps({
      data: makeSnapshot({ bankPayment: undefined }) as unknown as Record<string, unknown>,
    }));
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findClientInvoiceConfigByClientId, 'execute').mockResolvedValue(makeInvoiceConfig({
      type: ClientInvoiceConfigType.MONTHLY,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      dueDateDay: 10,
    }));
    jest.spyOn(issueBankPayment, 'execute').mockResolvedValue({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-fallback',
    });

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-fallback',
    });
    expect(findClientInvoiceConfigByClientId.execute).toHaveBeenCalledWith(1);
    expect(issueBankPayment.execute).toHaveBeenCalledWith(expect.objectContaining({
      amount: 1000,
      yourNumber: '1',
    }));
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(nfse.props).toMatchObject({
      bankPaymentProvider: BankPaymentProvider.INTER,
      bankPaymentRequestCode: 'req-fallback',
    });
  });

  it('should propagate Inter/bank payment errors for BullMQ retry', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    const err = new Error('Inter unavailable');
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(issueBankPayment, 'execute').mockRejectedValue(err);

    // Act & Assert
    await expect(sut.execute({ nfseId: 1 })).rejects.toBe(err);
    expect(nfseRepository.edit).not.toHaveBeenCalled();
  });

  it('should log and return when snapshot bankPayment is missing and fallback fails', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps({
      data: makeSnapshot({ bankPayment: undefined }) as unknown as Record<string, unknown>,
    }));
    const err = new Error('config missing');
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findClientInvoiceConfigByClientId, 'execute').mockRejectedValue(err);
    const loggerSpy = jest.spyOn(logger, 'error');

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(result).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(LogContext.BANK_PAYMENT, expect.objectContaining({
      adapter: 'nfse',
      action: 'processIssueNfseBankPayment',
      error: expect.any(Error),
    }));
    expect(issueBankPayment.execute).not.toHaveBeenCalled();
  });

  it('should log AppException and return when ClientInvoiceConfigNotFoundError on fallback', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps({
      data: makeSnapshot({ bankPayment: undefined }) as unknown as Record<string, unknown>,
    }));
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findClientInvoiceConfigByClientId, 'execute').mockRejectedValue(new ClientInvoiceConfigNotFoundError());
    const loggerSpy = jest.spyOn(logger, 'error');

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(result).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(LogContext.BANK_PAYMENT, expect.objectContaining({
      adapter: 'nfse',
      action: 'processIssueNfseBankPayment',
      error: expect.any(AppException),
    }));
    expect((loggerSpy.mock.calls[0][1] as { error: Error }).error.message).toBe(
      'Configuração de faturamento do cliente ausente para emissão do boleto.',
    );
    expect(issueBankPayment.execute).not.toHaveBeenCalled();
    expect(nfseRepository.edit).not.toHaveBeenCalled();
  });

  it('should log and return when mapper fails without calling Inter', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps({
      data: makeSnapshot({
        input: {
          companyId: 1,
          clientId: 1,
          simpleNationalOptant: false,
          fiscalIncentive: false,
          service: {
            serviceListItemCode: '01.07',
            nbsCode: '1.1501.30.00',
            indopCode: '050101',
            description: 'Serviço',
            serviceMunicipalCodeIbge: '3529401',
            issExigibility: 1,
            issWithheld: false,
            servicesValue: 0,
          },
        },
      }) as unknown as Record<string, unknown>,
    }));
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    const loggerSpy = jest.spyOn(logger, 'error');

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(result).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(LogContext.BANK_PAYMENT, expect.objectContaining({
      adapter: 'nfse',
      action: 'processIssueNfseBankPayment',
      error: expect.any(AppException),
    }));
    expect(issueBankPayment.execute).not.toHaveBeenCalled();
    expect(nfseRepository.edit).not.toHaveBeenCalled();
  });

  describe('payload determinism (Inter 30-minute idempotency key)', () => {
    it('should derive the competence from issuedAt, not from the clock', async() => {
      // Arrange — nota emitida em julho, job rodando em outro mês: o vencimento tem de sair de julho.
      const nfse = NfseFactory.load(makeNfseProps({
        issuedAt: new Date('2026-07-10T12:00:00-03:00'),
        data: makeSnapshot({ bankPayment: undefined }) as unknown as Record<string, unknown>,
      }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(findClientInvoiceConfigByClientId, 'execute').mockResolvedValue(makeInvoiceConfig({ dueDateDay: 15 }));
      jest.spyOn(issueBankPayment, 'execute').mockResolvedValue({
        provider: BankPaymentProvider.INTER,
        requestCode: 'req-1',
      });

      // Act
      await sut.execute({ nfseId: 1 });

      // Assert
      expect(issueBankPayment.execute).toHaveBeenCalledWith(
        expect.objectContaining({ dueDate: '2026-07-15' }),
      );
    });

    it('should produce an identical payload on every attempt', async() => {
      // Arrange
      jest.spyOn(findClientInvoiceConfigByClientId, 'execute').mockResolvedValue(makeInvoiceConfig({ dueDateDay: 15 }));
      jest.spyOn(issueBankPayment, 'execute').mockResolvedValue({
        provider: BankPaymentProvider.INTER,
        requestCode: 'req-1',
      });

      const runOnce = async() => {
        const nfse = NfseFactory.load(makeNfseProps({
          issuedAt: new Date('2026-07-31T23:59:00-03:00'),
          data: makeSnapshot({ bankPayment: undefined }) as unknown as Record<string, unknown>,
        }));
        jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
        await sut.execute({ nfseId: 1 });
        return jest.mocked(issueBankPayment.execute).mock.calls.at(-1)?.[0];
      };

      // Act — a segunda tentativa acontece depois da virada do mês.
      const first = await runOnce();
      const second = await runOnce();

      // Assert
      expect(second).toEqual(first);
    });

    it('should log and return when the nfse has no issuedAt', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps({ issuedAt: null }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      const loggerSpy = jest.spyOn(logger, 'error');

      // Act
      const result = await sut.execute({ nfseId: 1 });

      // Assert
      expect(result).toBeNull();
      expect(loggerSpy).toHaveBeenCalled();
      expect(issueBankPayment.execute).not.toHaveBeenCalled();
    });
  });

  describe('duplicate rejection from the provider', () => {
    const EXISTING_REQUEST_CODE = 'ab3242a2-2205-4f5e-9f54-32caf508cfe5';

    function makeExistingBankPayment(overrides: Partial<BankPaymentDto> = {}): BankPaymentDto {
      return createMock<BankPaymentDto>({
        provider: BankPaymentProvider.INTER,
        requestCode: EXISTING_REQUEST_CODE,
        yourNumber: '1',
        ...overrides,
      });
    }

    it('should link the existing charge instead of failing when the provider reports a duplicate', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps());
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(issueBankPayment, 'execute')
        .mockRejectedValue(new BankPaymentAlreadyExistsError(EXISTING_REQUEST_CODE));
      jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeExistingBankPayment());

      // Act
      const result = await sut.execute({ nfseId: 1 });

      // Assert
      expect(findBankPayment.execute).toHaveBeenCalledWith(EXISTING_REQUEST_CODE, BankPaymentProvider.INTER);
      expect(result).toEqual({ provider: BankPaymentProvider.INTER, requestCode: EXISTING_REQUEST_CODE });
      expect(nfse.props).toMatchObject({
        bankPaymentProvider: BankPaymentProvider.INTER,
        bankPaymentRequestCode: EXISTING_REQUEST_CODE,
      });
      expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    });

    it('should rethrow when the existing charge belongs to another nfse', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps());
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(issueBankPayment, 'execute')
        .mockRejectedValue(new BankPaymentAlreadyExistsError(EXISTING_REQUEST_CODE));
      jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeExistingBankPayment({ yourNumber: '999' }));

      // Act & Assert
      await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(BankPaymentAlreadyExistsError);
      expect(nfse.props.bankPaymentRequestCode).toBeNull();
    });

    it('should propagate any other provider error untouched', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps());
      const error = new AppException('Falha na comunicação');
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(issueBankPayment, 'execute').mockRejectedValue(error);

      // Act & Assert
      await expect(sut.execute({ nfseId: 1 })).rejects.toBe(error);
      expect(findBankPayment.execute).not.toHaveBeenCalled();
    });
  });
});
