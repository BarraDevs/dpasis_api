import { createMock } from '@golevelup/ts-jest';
import { RecordJobAudit } from 'src/app/audit/application/usecases/record-job-audit/record-job-audit.service';
import { Test } from '@nestjs/testing';
import { FindBankPayment } from 'src/app/bank-payment/application/usecases/find-bank-payment/find-bank-payment.service';
import { RecordPaidBankPaymentCashFlowEntry } from 'src/app/cash-flow-entry/application/usecases/record-paid-bank-payment-cash-flow-entry/record-paid-bank-payment-cash-flow-entry.service';
import { FindClientInvoiceConfigByClientId } from 'src/app/client/client-invoice-config/application/usecases/find-client-invoice-config-by-client-id/find-client-invoice-config-by-client-id.service';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentDto } from 'src/infra/bank-payment/dtos/bank-payment.dto';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import type { ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { NfseProps } from '../../../domain/entities/nfse.entity';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseFactory } from '../../../domain/factories/nfse.factory';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import { SettleNfseBankPayment } from './settle-nfse-bank-payment.service';

function makeNfseProps(overrides: Partial<NfseProps> = {}): NfseProps {
  return {
    id: 1,
    companyId: 1,
    clientId: 1,
    rpsNumber: 41,
    rpsSeries: 'NFSE',
    status: NfseStatus.ISSUED,
    batchProtocol: 'PROTO-1',
    nfseNumber: '12345',
    verificationCode: 'ABC',
    issuedAt: new Date('2026-09-03T10:00:00Z'),
    errorMessage: null,
    canceledAt: null,
    cancelReasonCode: null,
    bankPaymentProvider: BankPaymentProvider.INTER,
    bankPaymentRequestCode: 'req-1',
    bankPaymentIdempotencyKey: 'nfse-1',
    bankPaymentRequestedAt: new Date('2026-09-03T10:05:00Z'),
    bankPaymentErrorMessage: null,
    bankPaymentFailedAt: null,
    bankPaymentStatus: BankPaymentStatus.EMITTED,
    bankPaymentConfirmedAt: new Date('2026-09-03T10:15:00Z'),
    bankPaymentSettledAt: null,
    bankPaymentNextSettlementAt: new Date('2026-09-03T10:15:00Z'),
    reconcileAttemptCount: 0,
    nextReconcileAt: null,
    createdAt: new Date('2026-09-03T09:00:00Z'),
    nfmId: 500,
    data: {},
    ...overrides,
  };
}

function makeBankPayment(status: BankPaymentStatus): BankPaymentDto {
  return createMock<BankPaymentDto>({
    provider: BankPaymentProvider.INTER,
    requestCode: 'req-1',
    status,
    amount: 100,
  });
}

describe('SettleNfseBankPayment - Unit tests', () => {
  let sut: SettleNfseBankPayment;
  let nfseRepository: INfseRepository;
  let findBankPayment: FindBankPayment;
  let recordJobAudit: RecordJobAudit;
  let recordPaidBankPaymentCashFlowEntry: RecordPaidBankPaymentCashFlowEntry;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        SettleNfseBankPayment,
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: TOKENS.NfseRepository, useValue: createMock<INfseRepository>() },
        { provide: FindBankPayment, useValue: createMock<FindBankPayment>() },
        {
          provide: FindClientInvoiceConfigByClientId,
          useValue: createMock<FindClientInvoiceConfigByClientId>({
            execute: jest.fn().mockResolvedValue({ bank: { id: 1 } }),
          }),
        },
        { provide: RecordJobAudit, useValue: createMock<RecordJobAudit>() },
        {
          provide: RecordPaidBankPaymentCashFlowEntry,
          useValue: createMock<RecordPaidBankPaymentCashFlowEntry>(),
        },
      ],
    }).compile();

    sut = module.get(SettleNfseBankPayment);
    nfseRepository = module.get(TOKENS.NfseRepository);
    findBankPayment = module.get(FindBankPayment);
    recordJobAudit = module.get(RecordJobAudit);
    recordPaidBankPaymentCashFlowEntry = module.get(RecordPaidBankPaymentCashFlowEntry);
    jest.spyOn(recordPaidBankPaymentCashFlowEntry, 'execute').mockResolvedValue({ id: 1 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw when the nfse does not exist', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(NfseNotFoundError);
  });

  it('should be a no-op when the request code is unknown', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findByBankPaymentRequestCode').mockResolvedValue(null);

    // Act
    const result = await sut.execute({ requestCode: 'missing' });

    // Assert
    expect(result).toBeNull();
    expect(findBankPayment.execute).not.toHaveBeenCalled();
  });

  it('should be a no-op when there is no charge to settle', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(
      NfseFactory.load(makeNfseProps({ bankPaymentRequestCode: null })),
    );

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(result).toBeNull();
    expect(findBankPayment.execute).not.toHaveBeenCalled();
  });

  it('should skip the provider when the charge is already settled', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(
      NfseFactory.load(makeNfseProps({
        bankPaymentStatus: BankPaymentStatus.PAID,
        bankPaymentSettledAt: new Date('2026-09-17T12:00:00Z'),
      })),
    );

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(result).toEqual({ nfseId: 1, status: BankPaymentStatus.PAID, settled: true });
    expect(findBankPayment.execute).not.toHaveBeenCalled();
    expect(nfseRepository.edit).not.toHaveBeenCalled();
    expect(recordPaidBankPaymentCashFlowEntry.execute).toHaveBeenCalledWith({
      companyId: 1,
      nfseId: 1,
      bankPaymentRequestCode: 'req-1',
      occurredAt: new Date('2026-09-17T12:00:00Z'),
      amount: undefined,
    });
  });

  it('should fetch the amount when already settled paid has no cash-flow row', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(
      NfseFactory.load(makeNfseProps({
        bankPaymentStatus: BankPaymentStatus.PAID,
        bankPaymentSettledAt: new Date('2026-09-17T12:00:00Z'),
      })),
    );
    jest.spyOn(recordPaidBankPaymentCashFlowEntry, 'execute')
      .mockResolvedValueOnce({ id: null })
      .mockResolvedValueOnce({ id: 20 });
    jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeBankPayment(BankPaymentStatus.PAID));

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(findBankPayment.execute).toHaveBeenCalledWith('req-1', BankPaymentProvider.INTER, 1);
    expect(recordPaidBankPaymentCashFlowEntry.execute).toHaveBeenNthCalledWith(2, expect.objectContaining({
      amount: 100,
      nfseId: 1,
    }));
  });

  it.each(['', '   '])('should be a no-op when requestCode is blank (%s)', async(requestCode) => {
    // Act
    const result = await sut.execute({ requestCode });

    // Assert
    expect(result).toBeNull();
    expect(nfseRepository.findByBankPaymentRequestCode).not.toHaveBeenCalled();
    expect(findBankPayment.execute).not.toHaveBeenCalled();
  });

  it('should trim the request code before lookup', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findByBankPaymentRequestCode').mockResolvedValue(null);

    // Act
    await sut.execute({ requestCode: '  req-1  ' });

    // Assert
    expect(nfseRepository.findByBankPaymentRequestCode).toHaveBeenCalledWith('req-1');
  });

  it('should default the provider to INTER when the note has none', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps({ bankPaymentProvider: null }));
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeBankPayment(BankPaymentStatus.PAID));

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(findBankPayment.execute).toHaveBeenCalledWith('req-1', BankPaymentProvider.INTER, 1);
  });

  it('should record a job audit when the charge is persisted', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeBankPayment(BankPaymentStatus.PAID));

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(recordJobAudit.record).toHaveBeenCalledWith({
      jobName: 'settle-nfse-bank-payment',
      nfseId: 1,
      from: null,
      to: BankPaymentStatus.PAID,
      reason: 'Cobrança req-1 · liquidada=true',
      succeeded: true,
    });
  });

  it.each([
    BankPaymentStatus.PAID,
    BankPaymentStatus.RECEIVED,
    BankPaymentStatus.MARKED_RECEIVED,
    BankPaymentStatus.CANCELLED,
    BankPaymentStatus.EXPIRED,
  ])('should persist %s from the provider', async(status) => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findByBankPaymentRequestCode').mockResolvedValue(nfse);
    jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeBankPayment(status));

    // Act
    const result = await sut.execute({ requestCode: 'req-1' });

    // Assert
    expect(findBankPayment.execute).toHaveBeenCalledWith('req-1', BankPaymentProvider.INTER, 1);
    expect(nfse.props.bankPaymentStatus).toBe(status);
    expect(nfse.props.bankPaymentSettledAt).toBeInstanceOf(Date);
    expect(nfse.props.bankPaymentNextSettlementAt).toBeNull();
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(result).toEqual({ nfseId: 1, status, settled: true });
    if (status === BankPaymentStatus.CANCELLED || status === BankPaymentStatus.EXPIRED) {
      expect(recordPaidBankPaymentCashFlowEntry.execute).not.toHaveBeenCalled();
    }
    else {
      expect(recordPaidBankPaymentCashFlowEntry.execute).toHaveBeenCalledWith(expect.objectContaining({
        amount: 100,
        nfseId: 1,
        bankPaymentRequestCode: 'req-1',
      }));
    }
  });

  it('should push the next check when the charge is still open', async() => {
    // Arrange
    jest.useFakeTimers({ now: new Date('2026-09-17T12:00:00Z') });
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeBankPayment(BankPaymentStatus.EMITTED));

    // Act
    const result = await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfse.props.bankPaymentSettledAt).toBeNull();
    expect(nfse.props.bankPaymentNextSettlementAt).toEqual(new Date('2026-09-17T18:00:00Z'));
    expect(result).toEqual({ nfseId: 1, status: BankPaymentStatus.EMITTED, settled: false });

    jest.useRealTimers();
  });

  it('should propagate ExternalApiError when the GET fails', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(NfseFactory.load(makeNfseProps()));
    jest.spyOn(findBankPayment, 'execute').mockRejectedValue(new ExternalApiError('Banco Inter indisponível.'));

    // Act & Assert
    await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(ExternalApiError);
  });
});
