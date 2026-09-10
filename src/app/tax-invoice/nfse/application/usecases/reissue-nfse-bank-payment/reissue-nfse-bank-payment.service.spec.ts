import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { RecordJobAudit } from 'src/app/audit/application/usecases/record-job-audit/record-job-audit.service';
import { FindBankPayment } from 'src/app/bank-payment/application/usecases/find-bank-payment/find-bank-payment.service';
import { NfseNotIssuedForBankPaymentError } from 'src/app/bank-payment/domain/errors/nfse-not-issued-for-bank-payment.error';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentDto } from 'src/infra/bank-payment/dtos/bank-payment.dto';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import type { ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfseProps } from '../../../domain/entities/nfse.entity';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseBankPaymentNotLinkedError } from '../../../domain/errors/nfse-bank-payment-not-linked.error';
import { NfseBankPaymentNotReissuableError } from '../../../domain/errors/nfse-bank-payment-not-reissuable.error';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseFactory } from '../../../domain/factories/nfse.factory';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import { ReissueNfseBankPayment } from './reissue-nfse-bank-payment.service';

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
    issuedAt: new Date('2026-09-10T12:00:00-03:00'),
    errorMessage: null,
    canceledAt: null,
    cancelReasonCode: null,
    bankPaymentProvider: BankPaymentProvider.INTER,
    bankPaymentRequestCode: 'req-failed',
    bankPaymentIdempotencyKey: 'nfse-1',
    bankPaymentRequestedAt: new Date('2026-09-10T12:05:00-03:00'),
    bankPaymentErrorMessage: 'Provedor reportou falha na emissão da cobrança req-failed',
    bankPaymentFailedAt: new Date('2026-09-10T12:20:00-03:00'),
    bankPaymentStatus: BankPaymentStatus.FAILED,
    bankPaymentConfirmedAt: null,
    reconcileAttemptCount: 0,
    nextReconcileAt: null,
    createdAt: new Date('2026-09-10T11:00:00-03:00'),
    nfmId: 10,
    data: {},
    ...overrides,
  };
}

function makeProviderCharge(status: BankPaymentStatus): BankPaymentDto {
  return createMock<BankPaymentDto>({
    provider: BankPaymentProvider.INTER,
    requestCode: 'req-failed',
    status,
  });
}

describe('ReissueNfseBankPayment - Unit tests', () => {
  let sut: ReissueNfseBankPayment;
  let nfseRepository: INfseRepository;
  let queueProducer: INfseQueueProducer;
  let findBankPayment: FindBankPayment;
  let recordJobAudit: RecordJobAudit;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ReissueNfseBankPayment,
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: TOKENS.NfseRepository, useValue: createMock<INfseRepository>() },
        { provide: TOKENS.NfseQueueProducer, useValue: createMock<INfseQueueProducer>() },
        { provide: FindBankPayment, useValue: createMock<FindBankPayment>() },
        { provide: RecordJobAudit, useValue: createMock<RecordJobAudit>() },
      ],
    }).compile();

    sut = module.get(ReissueNfseBankPayment);
    nfseRepository = module.get(TOKENS.NfseRepository);
    queueProducer = module.get(TOKENS.NfseQueueProducer);
    findBankPayment = module.get(FindBankPayment);
    recordJobAudit = module.get(RecordJobAudit);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfseNotFoundError when the nfse does not exist', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute({ nfseId: 1, reason: 'reemissão autorizada' })).rejects.toThrow(NfseNotFoundError);
  });

  it('should refuse a canceled nfse before asking the provider', async() => {
    // Arrange — a nota cancelada ainda carrega o código da cobrança.
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(NfseFactory.load(makeNfseProps({
      status: NfseStatus.CANCELED,
      canceledAt: new Date('2026-09-10T13:00:00-03:00'),
      cancelReasonCode: 1,
    })));

    // Act & Assert
    await expect(sut.execute({ nfseId: 1, reason: 'reemissão autorizada' }))
      .rejects.toThrow(NfseNotIssuedForBankPaymentError);
    expect(findBankPayment.execute).not.toHaveBeenCalled();
  });

  it('should refuse when there is no linked charge to replace', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(NfseFactory.load(makeNfseProps({
      bankPaymentProvider: null,
      bankPaymentRequestCode: null,
      bankPaymentStatus: null,
    })));

    // Act & Assert
    await expect(sut.execute({ nfseId: 1, reason: 'reemissão autorizada' }))
      .rejects.toThrow(NfseBankPaymentNotLinkedError);
    expect(findBankPayment.execute).not.toHaveBeenCalled();
  });

  it.each([BankPaymentStatus.EMITTED, BankPaymentStatus.AWAITING_APPROVAL, BankPaymentStatus.PAID])(
    'should keep the link when the provider says the charge is %s',
    async(status) => {
      // Arrange — o estado local diz FAILED, mas quem decide é o provedor.
      const nfse = NfseFactory.load(makeNfseProps());
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeProviderCharge(status));

      // Act & Assert
      await expect(sut.execute({ nfseId: 1, reason: 'reemissão autorizada' }))
        .rejects.toThrow(NfseBankPaymentNotReissuableError);
      expect(nfse.props.bankPaymentRequestCode).toBe('req-failed');
      expect(nfseRepository.edit).not.toHaveBeenCalled();
      expect(queueProducer.addIssueBankPaymentJob).not.toHaveBeenCalled();
    },
  );

  it('should unlink the failed charge, audit the decision and enqueue a new issuance', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeProviderCharge(BankPaymentStatus.FAILED));

    // Act
    const result = await sut.execute({ nfseId: 1, reason: 'Inter reportou FALHA_EMISSAO' });

    // Assert
    expect(findBankPayment.execute).toHaveBeenCalledWith('req-failed', BankPaymentProvider.INTER);
    expect(result).toEqual({ nfseId: 1, replacedRequestCode: 'req-failed' });
    expect(nfse.props).toMatchObject({
      status: NfseStatus.ISSUED,
      bankPaymentRequestCode: null,
      bankPaymentStatus: null,
      bankPaymentRequestedAt: null,
      bankPaymentFailedAt: null,
    });
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(recordJobAudit.record).toHaveBeenCalledWith(expect.objectContaining({
      jobName: 'reissue-nfse-bank-payment',
      nfseId: 1,
      reason: expect.stringContaining('req-failed'),
    }));
    expect(queueProducer.addIssueBankPaymentJob).toHaveBeenCalledWith({ nfseId: 1 });
  });

  it('should commit the unlink before enqueueing, so a lost job is recovered by the sweep', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(NfseFactory.load(makeNfseProps()));
    jest.spyOn(findBankPayment, 'execute').mockResolvedValue(makeProviderCharge(BankPaymentStatus.FAILED));

    // Act
    await sut.execute({ nfseId: 1, reason: 'Inter reportou FALHA_EMISSAO' });

    // Assert
    const editOrder = jest.mocked(nfseRepository.edit).mock.invocationCallOrder[0];
    const enqueueOrder = jest.mocked(queueProducer.addIssueBankPaymentJob).mock.invocationCallOrder[0];
    expect(editOrder).toBeLessThan(enqueueOrder);
  });
});
