import { createMock } from '@golevelup/ts-jest';
import { RecordJobAudit } from 'src/app/audit/application/usecases/record-job-audit/record-job-audit.service';
import { Test } from '@nestjs/testing';
import { FindBankPaymentByYourNumber } from 'src/app/bank-payment/application/usecases/find-bank-payment-by-your-number/find-bank-payment-by-your-number.service';
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
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { BankPaymentAlreadyExistsError } from 'src/infra/bank-payment/errors/bank-payment-already-exists.error';
import { PermanentProviderError } from 'src/shared/errors/permanent-provider.error';
import { RetryScheduledError } from 'src/shared/errors/retry-scheduled.error';
import { TransientProviderError } from 'src/shared/errors/transient-provider.error';
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
    bank: {
      fineRate: null,
      moraRate: null,
    } as ClientInvoiceConfigDto['bank'],
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
    bankPaymentIdempotencyKey: null,
    bankPaymentRequestedAt: null,
    bankPaymentErrorMessage: null,
    bankPaymentFailedAt: null,
    bankPaymentStatus: null,
    bankPaymentConfirmedAt: null,
    reconcileAttemptCount: 0,
    nextReconcileAt: null,
    createdAt: new Date('2026-07-20T12:00:00Z'),
    nfmId: null,
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
  let findBankPaymentByYourNumber: FindBankPaymentByYourNumber;
  let findClientInvoiceConfigByClientId: FindClientInvoiceConfigByClientId;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ProcessIssueNfseBankPayment,
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: TOKENS.NfseRepository, useValue: createMock<INfseRepository>() },
        { provide: IssueBankPayment, useValue: createMock<IssueBankPayment>() },
        { provide: FindBankPayment, useValue: createMock<FindBankPayment>() },
        { provide: FindBankPaymentByYourNumber, useValue: createMock<FindBankPaymentByYourNumber>() },
        { provide: FindClientInvoiceConfigByClientId, useValue: createMock<FindClientInvoiceConfigByClientId>() },
        { provide: RecordJobAudit, useValue: createMock<RecordJobAudit>() },
      ],
    }).compile();

    sut = module.get(ProcessIssueNfseBankPayment);
    logger = module.get(TOKENS.LoggerGateway);
    nfseRepository = module.get(TOKENS.NfseRepository);
    issueBankPayment = module.get(IssueBankPayment);
    findBankPayment = module.get(FindBankPayment);
    findBankPaymentByYourNumber = module.get(FindBankPaymentByYourNumber);
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
      fineRate: null,
      moraRate: null,
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
      fineRate: null,
      moraRate: null,
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
    // A intenção fica gravada antes da chamada: é ela que faz a retentativa consultar em vez de
    // repetir o POST.
    expect(nfse.props.bankPaymentRequestedAt).toBeInstanceOf(Date);
    expect(nfse.props.bankPaymentIdempotencyKey).toBe('nfse-1');
    expect(nfse.props.bankPaymentRequestCode).toBeNull();
  });

  it('should log and throw PermanentProviderError when snapshot bankPayment is missing and fallback fails', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps({
      data: makeSnapshot({ bankPayment: undefined }) as unknown as Record<string, unknown>,
    }));
    const err = new Error('config missing');
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findClientInvoiceConfigByClientId, 'execute').mockRejectedValue(err);
    const loggerSpy = jest.spyOn(logger, 'error');

    // Act & Assert — o job precisa falhar: devolver `null` completava com sucesso e o rastro sumia.
    await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(PermanentProviderError);
    expect(loggerSpy).toHaveBeenCalledWith(LogContext.BANK_PAYMENT, expect.objectContaining({
      adapter: 'nfse',
      action: 'processIssueNfseBankPayment',
      error: expect.any(Error),
    }));
    expect(issueBankPayment.execute).not.toHaveBeenCalled();
  });

  it('should log AppException and throw when ClientInvoiceConfigNotFoundError on fallback', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps({
      data: makeSnapshot({ bankPayment: undefined }) as unknown as Record<string, unknown>,
    }));
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findClientInvoiceConfigByClientId, 'execute').mockRejectedValue(new ClientInvoiceConfigNotFoundError());
    const loggerSpy = jest.spyOn(logger, 'error');

    // Act & Assert
    await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(PermanentProviderError);
    expect(loggerSpy).toHaveBeenCalledWith(LogContext.BANK_PAYMENT, expect.objectContaining({
      adapter: 'nfse',
      action: 'processIssueNfseBankPayment',
      error: expect.any(AppException),
    }));
    expect((loggerSpy.mock.calls[0][1] as { error: Error }).error.message).toBe(
      'Configuração de faturamento do cliente ausente para emissão do boleto.',
    );
    expect(issueBankPayment.execute).not.toHaveBeenCalled();
    expect(nfse.props.bankPaymentErrorMessage).toBe(
      'Configuração de faturamento do cliente ausente para emissão do boleto.',
    );
    expect(nfse.props.bankPaymentFailedAt).toBeInstanceOf(Date);
  });

  it('should pass bank charges from invoice config when issuing', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findClientInvoiceConfigByClientId, 'execute').mockResolvedValue(makeInvoiceConfig({
      bank: {
        fineRate: 2,
        moraRate: 1,
      } as ClientInvoiceConfigDto['bank'],
    }));
    jest.spyOn(issueBankPayment, 'execute').mockResolvedValue({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-charges',
    });

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(issueBankPayment.execute).toHaveBeenCalledWith(expect.objectContaining({
      fineRate: 2,
      moraRate: 1,
    }));
  });

  it('should issue without charges when snapshot has bankPayment and invoice config is missing', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findClientInvoiceConfigByClientId, 'execute').mockRejectedValue(new ClientInvoiceConfigNotFoundError());
    jest.spyOn(issueBankPayment, 'execute').mockResolvedValue({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-snapshot',
    });
    const loggerSpy = jest.spyOn(logger, 'error');

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-snapshot',
    });
    expect(issueBankPayment.execute).toHaveBeenCalledWith(expect.objectContaining({
      fineRate: null,
      moraRate: null,
    }));
    expect(loggerSpy).not.toHaveBeenCalled();
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
  });

  it('should fail the job when snapshot has bankPayment and invoice config lookup fails with a generic error', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    const err = new Error('database down');
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findClientInvoiceConfigByClientId, 'execute').mockRejectedValue(err);
    const loggerSpy = jest.spyOn(logger, 'error');

    // Act & Assert
    await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(PermanentProviderError);
    expect(loggerSpy).toHaveBeenCalledWith(LogContext.BANK_PAYMENT, expect.objectContaining({
      adapter: 'nfse',
      action: 'processIssueNfseBankPayment',
      error: err,
    }));
    expect(issueBankPayment.execute).not.toHaveBeenCalled();
    expect(nfse.props.bankPaymentFailedAt).toBeInstanceOf(Date);
  });

  it('should log and throw when mapper fails, without calling Inter', async() => {
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

    // Act & Assert
    await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(PermanentProviderError);
    expect(loggerSpy).toHaveBeenCalledWith(LogContext.BANK_PAYMENT, expect.objectContaining({
      adapter: 'nfse',
      action: 'processIssueNfseBankPayment',
      error: expect.any(AppException),
    }));
    expect(issueBankPayment.execute).not.toHaveBeenCalled();
    expect(nfse.props.bankPaymentErrorMessage).toBe('Valor dos serviços inválido para emissão do boleto.');
    expect(nfse.props.bankPaymentFailedAt).toBeInstanceOf(Date);
    // O provedor nunca foi chamado, então a intenção não deve ter sido gravada.
    expect(nfse.props.bankPaymentRequestedAt).toBeNull();
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

    it('should log and throw when the nfse has no issuedAt', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps({ issuedAt: null }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      const loggerSpy = jest.spyOn(logger, 'error');

      // Act & Assert
      await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(PermanentProviderError);
      expect(loggerSpy).toHaveBeenCalled();
      expect(issueBankPayment.execute).not.toHaveBeenCalled();
    });
  });

  describe('transient vs permanent classification', () => {
    it('should rethrow PermanentProviderError after recording the bank-payment failure', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps());
      const err = new PermanentProviderError('Vencimento inválido.');
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(issueBankPayment, 'execute').mockRejectedValue(err);

      // Act & Assert
      await expect(sut.execute({ nfseId: 1 })).rejects.toBe(err);
      expect(nfse.props.bankPaymentErrorMessage).toBe('Vencimento inválido.');
      expect(nfse.props.bankPaymentFailedAt).toBeInstanceOf(Date);
      // Permanente não entra na escada: é o alerta de cobrança com falha que chama o humano.
      expect(nfse.props.bankPaymentNextRetryAt).toBeNull();
    });

    it('should hand the transient error back to the queue once the due date can no longer be issued', async() => {
      // Arrange — o relógio real já passou do vencimento do fixture (20/08/2026): não há degrau possível.
      const nfse = NfseFactory.load(makeNfseProps());
      const err = new TransientProviderError('Banco Inter respondeu com erro 500.');
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(issueBankPayment, 'execute').mockRejectedValue(err);

      // Act & Assert
      await expect(sut.execute({ nfseId: 1 })).rejects.toBe(err);
      expect(nfse.props.bankPaymentNextRetryAt).toBeNull();
      expect(nfse.props.bankPaymentErrorMessage).toContain('Retentativa automática encerrada');
    });
  });

  describe('automatic retry ladder after a transient provider failure', () => {
    // Emitida 20/08/2026 12:00 com vencimento configurado no dia 15: o piso manda o vencimento para
    // o próprio dia 20, e o Inter aceita emitir até 19h59 de Brasília (22:59:59Z).
    const NOW = new Date('2026-08-20T16:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers({ now: NOW });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should schedule the first rung and hand the job a RetryScheduledError', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps());
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(issueBankPayment, 'execute')
        .mockRejectedValue(new TransientProviderError('Banco Inter respondeu com erro 500.'));

      // Act
      const error = await sut.execute({ nfseId: 1 }).catch((e: unknown) => e);

      // Assert
      expect(error).toBeInstanceOf(RetryScheduledError);
      expect((error as RetryScheduledError).nextAttemptAt).toEqual(new Date('2026-08-20T16:05:00Z'));
      expect((error as Error).message)
        .toBe('Banco Inter respondeu com erro 500. Nova tentativa automática em 20/08/2026 13:05.');
      expect(nfse.props).toMatchObject({
        bankPaymentRequestCode: null,
        bankPaymentNextRetryAt: new Date('2026-08-20T16:05:00Z'),
        bankPaymentErrorMessage: 'Banco Inter respondeu com erro 500. Nova tentativa automática em 20/08/2026 13:05.',
      });
      expect(nfse.props.bankPaymentFailedAt).toBeInstanceOf(Date);
      expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    });

    it('should pick the rung from the rounds already started, repeating the last one', async() => {
      // Arrange — nona rodada: a escada acabou no degrau de 6h e fica nele.
      const nfse = NfseFactory.load(makeNfseProps({
        bankPaymentRequestedAt: new Date('2026-08-20T15:00:00Z'),
        bankPaymentIdempotencyKey: 'nfse-1',
        bankPaymentRetryCount: 9,
      }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(findBankPaymentByYourNumber, 'execute').mockResolvedValue(null);
      jest.spyOn(issueBankPayment, 'execute').mockRejectedValue(new TransientProviderError('Banco Inter indisponível.'));

      // Act
      const error = await sut.execute({ nfseId: 1 }).catch((e: unknown) => e);

      // Assert
      expect((error as RetryScheduledError).nextAttemptAt).toEqual(new Date('2026-08-20T22:00:00Z'));
    });

    it('should wait for a Retry-After longer than the rung', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps());
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(issueBankPayment, 'execute')
        .mockRejectedValue(new TransientProviderError('Banco Inter respondeu com 429.', 1200));

      // Act
      const error = await sut.execute({ nfseId: 1 }).catch((e: unknown) => e);

      // Assert
      expect((error as RetryScheduledError).nextAttemptAt).toEqual(new Date('2026-08-20T16:20:00Z'));
    });

    it('should stop once the next rung would pass 19h59 of the due date', async() => {
      // Arrange — 19h de Brasília no dia do vencimento; o degrau de 1h cai depois do corte.
      jest.setSystemTime(new Date('2026-08-20T22:00:00Z'));
      const err = new TransientProviderError('Banco Inter indisponível.');
      const nfse = NfseFactory.load(makeNfseProps({
        bankPaymentRequestedAt: new Date('2026-08-20T15:00:00Z'),
        bankPaymentIdempotencyKey: 'nfse-1',
        bankPaymentRetryCount: 3,
      }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(findBankPaymentByYourNumber, 'execute').mockResolvedValue(null);
      jest.spyOn(issueBankPayment, 'execute').mockRejectedValue(err);

      // Act & Assert — sem degrau, o erro original volta para a fila decidir.
      await expect(sut.execute({ nfseId: 1 })).rejects.toBe(err);
      expect(nfse.props.bankPaymentNextRetryAt).toBeNull();
    });

    it('should stop once the next rung would pass 24h since the first request', async() => {
      // Arrange — vencimento no dia 28, bem longe; quem limita é a janela de 24h.
      jest.setSystemTime(new Date('2026-08-21T16:00:00Z'));
      const err = new TransientProviderError('Banco Inter indisponível.');
      const nfse = NfseFactory.load(makeNfseProps({
        bankPaymentRequestedAt: new Date('2026-08-20T16:30:00Z'),
        bankPaymentIdempotencyKey: 'nfse-1',
        bankPaymentRetryCount: 3,
        data: makeSnapshot({
          bankPayment: { ...makeSnapshot().bankPayment!, dueDateDay: 28 },
        }) as unknown as Record<string, unknown>,
      }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(findBankPaymentByYourNumber, 'execute').mockResolvedValue(null);
      jest.spyOn(issueBankPayment, 'execute').mockRejectedValue(err);

      // Act & Assert
      await expect(sut.execute({ nfseId: 1 })).rejects.toBe(err);
      expect(nfse.props.bankPaymentNextRetryAt).toBeNull();
      expect(nfse.props.bankPaymentErrorMessage).toContain('Retentativa automática encerrada');
    });

    it('should schedule when the seuNumero lookup itself fails transiently, without posting', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps({
        bankPaymentRequestedAt: new Date('2026-08-20T15:50:00Z'),
        bankPaymentIdempotencyKey: 'nfse-1',
      }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(findBankPaymentByYourNumber, 'execute')
        .mockRejectedValue(new TransientProviderError('Banco Inter indisponível.'));

      // Act
      const error = await sut.execute({ nfseId: 1 }).catch((e: unknown) => e);

      // Assert
      expect(error).toBeInstanceOf(RetryScheduledError);
      expect(issueBankPayment.execute).not.toHaveBeenCalled();
      expect(nfse.props.bankPaymentNextRetryAt).toEqual(new Date('2026-08-20T16:05:00Z'));
    });

    it('should clear the schedule when a later round links the charge', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps({
        bankPaymentRequestedAt: new Date('2026-08-20T15:50:00Z'),
        bankPaymentIdempotencyKey: 'nfse-1',
        bankPaymentErrorMessage: 'Banco Inter indisponível.',
        bankPaymentFailedAt: new Date('2026-08-20T15:50:00Z'),
        bankPaymentRetryCount: 1,
        bankPaymentNextRetryAt: new Date('2026-08-20T16:15:00Z'),
      }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(findBankPaymentByYourNumber, 'execute').mockResolvedValue(null);
      jest.spyOn(issueBankPayment, 'execute').mockResolvedValue({
        provider: BankPaymentProvider.INTER,
        requestCode: 'req-after-outage',
      });

      // Act
      await sut.execute({ nfseId: 1 });

      // Assert
      expect(nfse.props).toMatchObject({
        bankPaymentRequestCode: 'req-after-outage',
        bankPaymentNextRetryAt: null,
        bankPaymentFailedAt: null,
        bankPaymentErrorMessage: null,
      });
    });
  });

  describe('pre-flight lookup when a previous attempt already reached the provider', () => {
    const REQUESTED_AT = new Date('2026-08-20T15:05:00.000Z');

    function makeExisting(overrides: Partial<BankPaymentDto> = {}): BankPaymentDto {
      return createMock<BankPaymentDto>({
        provider: BankPaymentProvider.INTER,
        requestCode: 'existing-code',
        yourNumber: '1',
        amount: 1000,
        // Nota emitida no dia 20 com vencimento configurado no dia 15: o piso de vencimento manda a
        // data para o dia da emissão, porque o Inter recusa boleto vencido.
        dueDate: '2026-08-20',
        status: BankPaymentStatus.EMITTED,
        ...overrides,
      });
    }

    it('should link the charge found by seuNumero instead of posting again', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps({
        bankPaymentRequestedAt: REQUESTED_AT,
        bankPaymentIdempotencyKey: 'nfse-1',
      }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(findBankPaymentByYourNumber, 'execute').mockResolvedValue(makeExisting());

      // Act
      const result = await sut.execute({ nfseId: 1 });

      // Assert
      expect(findBankPaymentByYourNumber.execute).toHaveBeenCalledWith({
        provider: BankPaymentProvider.INTER,
        yourNumber: '1',
        amount: 1000,
        dueDate: '2026-08-20',
      });
      expect(issueBankPayment.execute).not.toHaveBeenCalled();
      expect(result).toEqual({ provider: BankPaymentProvider.INTER, requestCode: 'existing-code' });
      expect(nfse.props.bankPaymentRequestCode).toBe('existing-code');
    });

    it('should issue when the lookup finds nothing', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps({
        bankPaymentRequestedAt: REQUESTED_AT,
        bankPaymentIdempotencyKey: 'nfse-1',
      }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(findBankPaymentByYourNumber, 'execute').mockResolvedValue(null);
      jest.spyOn(issueBankPayment, 'execute').mockResolvedValue({
        provider: BankPaymentProvider.INTER,
        requestCode: 'req-new',
      });

      // Act
      const result = await sut.execute({ nfseId: 1 });

      // Assert
      expect(issueBankPayment.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ provider: BankPaymentProvider.INTER, requestCode: 'req-new' });
      // A marca da primeira tentativa é preservada — regravá-la não muda nada e apagá-la
      // reabriria a janela de emissão às cegas.
      expect(nfse.props.bankPaymentRequestedAt).toEqual(REQUESTED_AT);
    });

    it('should not query the provider on the first attempt', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps());
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(issueBankPayment, 'execute').mockResolvedValue({
        provider: BankPaymentProvider.INTER,
        requestCode: 'req-first',
      });

      // Act
      await sut.execute({ nfseId: 1 });

      // Assert
      expect(findBankPaymentByYourNumber.execute).not.toHaveBeenCalled();
      expect(nfse.props.bankPaymentIdempotencyKey).toBe('nfse-1');
    });
  });

  describe('duplicate rejection from the provider', () => {
    const EXISTING_REQUEST_CODE = 'ab3242a2-2205-4f5e-9f54-32caf508cfe5';

    function makeExistingBankPayment(overrides: Partial<BankPaymentDto> = {}): BankPaymentDto {
      return createMock<BankPaymentDto>({
        provider: BankPaymentProvider.INTER,
        requestCode: EXISTING_REQUEST_CODE,
        yourNumber: '1',
        amount: 1000,
        // Nota emitida no dia 20 com vencimento configurado no dia 15: o piso de vencimento manda a
        // data para o dia da emissão, porque o Inter recusa boleto vencido.
        dueDate: '2026-08-20',
        status: BankPaymentStatus.EMITTED,
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

    it('should fail permanently when the existing charge does not match this nfse', async() => {
      // Arrange — mesma chave para o Inter, seuNumero/valor/vencimento diferentes para nós.
      const nfse = NfseFactory.load(makeNfseProps());
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(issueBankPayment, 'execute')
        .mockRejectedValue(new BankPaymentAlreadyExistsError(EXISTING_REQUEST_CODE));
      jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeExistingBankPayment({ yourNumber: '999' }));

      // Act & Assert — antes escapava sem registro e a varredura repetia o POST a cada cinco minutos.
      await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(PermanentProviderError);
      expect(nfse.props.bankPaymentRequestCode).toBeNull();
      expect(nfse.props.bankPaymentFailedAt).toBeInstanceOf(Date);
      expect(nfse.props.bankPaymentNextRetryAt).toBeNull();
      expect(nfse.props.bankPaymentErrorMessage).toContain(EXISTING_REQUEST_CODE);
    });

    describe('inside the 30-minute window of a failed charge', () => {
      beforeEach(() => {
        jest.useFakeTimers({ now: new Date('2026-08-20T16:00:00Z') });
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should not relink the failed charge the provider still returns', async() => {
        // Arrange
        const nfse = NfseFactory.load(makeNfseProps());
        jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
        jest.spyOn(issueBankPayment, 'execute')
          .mockRejectedValue(new BankPaymentAlreadyExistsError(EXISTING_REQUEST_CODE));
        jest.spyOn(findBankPayment, 'execute')
          .mockResolvedValue(makeExistingBankPayment({ status: BankPaymentStatus.FAILED }));

        // Act
        const error = await sut.execute({ nfseId: 1 }).catch((e: unknown) => e);

        // Assert — vincular reabriria a FALHA_EMISSAO; passada a janela, o POST cria uma cobrança nova.
        expect(error).toBeInstanceOf(RetryScheduledError);
        expect(nfse.props.bankPaymentRequestCode).toBeNull();
        expect(nfse.props.bankPaymentNextRetryAt).toEqual(new Date('2026-08-20T16:05:00Z'));
      });

      it('should schedule a retry when confirming the duplicate fails transiently', async() => {
        // Arrange
        const nfse = NfseFactory.load(makeNfseProps());
        jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
        jest.spyOn(issueBankPayment, 'execute')
          .mockRejectedValue(new BankPaymentAlreadyExistsError(EXISTING_REQUEST_CODE));
        jest.spyOn(findBankPayment, 'execute')
          .mockRejectedValue(new TransientProviderError('Banco Inter indisponível.'));

        // Act
        const error = await sut.execute({ nfseId: 1 }).catch((e: unknown) => e);

        // Assert
        expect(error).toBeInstanceOf(RetryScheduledError);
        expect(nfse.props.bankPaymentRequestCode).toBeNull();
      });
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
