import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { NfseOutboxRowDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse-outbox-row.dto';
import { NfseReconcileTargetDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse-reconcile-target.dto';
import type { INfseOutboxDao } from 'src/app/tax-invoice/nfse/application/persistence/dao/nfse-outbox-dao.interface';
import type { INfseDao } from 'src/app/tax-invoice/nfse/application/persistence/dao/nfse-dao.interface';
import type { INfseRepository } from 'src/app/tax-invoice/nfse/application/persistence/repository/nfse-repository.interface';
import type { INfseQueueProducer } from 'src/app/tax-invoice/nfse/application/queue/nfse-queue-producer.interface';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { SweepNfseRecovery } from './sweep-nfse-recovery.service';

function makeOutboxRow(overrides: Partial<NfseOutboxRowDto> = {}): NfseOutboxRowDto {
  return { id: 100, nfseId: 1, jobName: JobName.IssueNfseBatch, payload: { nfseId: 1 }, ...overrides };
}

function makeTarget(overrides: Partial<NfseReconcileTargetDto> = {}): NfseReconcileTargetDto {
  return { id: 1, companyId: 10, rpsNumber: 41, rpsSeries: 'NFSE', status: NfseStatus.AWAITING_PROVIDER, ...overrides };
}

describe('SweepNfseRecovery - Unit tests', () => {
  let sut: SweepNfseRecovery;
  let nfseDao: INfseDao;
  let nfseOutboxDao: INfseOutboxDao;
  let nfseRepository: INfseRepository;
  let queueProducer: INfseQueueProducer;
  let logger: ILoggerGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        SweepNfseRecovery,
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: TOKENS.NfseDao, useValue: createMock<INfseDao>() },
        { provide: TOKENS.NfseOutboxDao, useValue: createMock<INfseOutboxDao>() },
        { provide: TOKENS.NfseRepository, useValue: createMock<INfseRepository>() },
        { provide: TOKENS.NfseQueueProducer, useValue: createMock<INfseQueueProducer>() },
      ],
    }).compile();

    sut = module.get(SweepNfseRecovery);
    nfseDao = module.get(TOKENS.NfseDao);
    nfseOutboxDao = module.get(TOKENS.NfseOutboxDao);
    nfseRepository = module.get(TOKENS.NfseRepository);
    queueProducer = module.get(TOKENS.NfseQueueProducer);
    logger = module.get(TOKENS.LoggerGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('sweepOutbox', () => {
    it('should only look at rows older than a minute, capped at 200', async() => {
      // Arrange — o despacho normal acontece milissegundos depois do commit.
      jest.spyOn(nfseOutboxDao, 'findUndispatched').mockResolvedValue([]);

      // Act
      await sut.sweepOutbox();

      // Assert
      expect(nfseOutboxDao.findUndispatched).toHaveBeenCalledWith(60, 200);
    });

    it('should enqueue the recorded job and mark the row dispatched', async() => {
      // Arrange
      jest.spyOn(nfseOutboxDao, 'findUndispatched').mockResolvedValue([makeOutboxRow()]);

      // Act
      const count = await sut.sweepOutbox();

      // Assert
      expect(queueProducer.addIssueBatchJob).toHaveBeenCalledWith({ nfseId: 1 });
      expect(nfseRepository.markOutboxDispatched).toHaveBeenCalledWith(100);
      expect(count).toBe(1);
    });

    it.each([
      [JobName.PollNfseBatch, 'addPollBatchJob'],
      [JobName.IssueNfseBankPayment, 'addIssueBankPaymentJob'],
    ])('should dispatch %s to the matching producer method', async(jobName, method) => {
      // Arrange
      jest.spyOn(nfseOutboxDao, 'findUndispatched').mockResolvedValue([makeOutboxRow({ jobName })]);

      // Act
      await sut.sweepOutbox();

      // Assert
      expect(queueProducer[method as keyof INfseQueueProducer]).toHaveBeenCalled();
    });

    it('should log and still mark an unknown job name, so it does not come back every sweep', async() => {
      // Arrange
      jest.spyOn(nfseOutboxDao, 'findUndispatched').mockResolvedValue([makeOutboxRow({ jobName: 'job-inexistente' })]);

      // Act
      await sut.sweepOutbox();

      // Assert
      expect(logger.error).toHaveBeenCalledWith(LogContext.NFS_GENERATION, expect.objectContaining({
        action: 'sweepOutbox',
        errorMessage: 'Job desconhecido no outbox: job-inexistente',
      }));
      expect(nfseRepository.markOutboxDispatched).toHaveBeenCalledWith(100);
    });
  });

  describe('sweepReconciliation', () => {
    it('should enqueue one reconcile job per due note', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findPendingReconciliation').mockResolvedValue([makeTarget({ id: 1 }), makeTarget({ id: 2 })]);

      // Act
      const count = await sut.sweepReconciliation();

      // Assert — o cron só enfileira; nenhuma chamada externa acontece aqui.
      expect(queueProducer.addReconcileNfseJob).toHaveBeenCalledWith({ nfseId: 1 });
      expect(queueProducer.addReconcileNfseJob).toHaveBeenCalledWith({ nfseId: 2 });
      expect(count).toBe(2);
    });

    it('should cap the batch at 200', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findPendingReconciliation').mockResolvedValue([]);

      // Act
      await sut.sweepReconciliation();

      // Assert
      expect(nfseDao.findPendingReconciliation).toHaveBeenCalledWith(200);
    });
  });

  describe('sweepMissingBankPayment', () => {
    it('should enqueue the bank payment job for issued notes with no charge', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findIssuedWithoutBankPaymentJob').mockResolvedValue([makeTarget({ id: 5 })]);

      // Act
      const count = await sut.sweepMissingBankPayment();

      // Assert
      expect(queueProducer.addIssueBankPaymentJob).toHaveBeenCalledWith({ nfseId: 5 });
      expect(count).toBe(1);
    });
  });

  describe('sweepBankPaymentConfirmation', () => {
    it('should only chase charges requested more than ten minutes ago', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findBankPaymentUnconfirmed').mockResolvedValue([]);

      // Act
      await sut.sweepBankPaymentConfirmation();

      // Assert
      expect(nfseDao.findBankPaymentUnconfirmed).toHaveBeenCalledWith(10, 200);
    });

    it('should enqueue one confirmation job per unconfirmed charge', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findBankPaymentUnconfirmed').mockResolvedValue([makeTarget({ id: 9 })]);

      // Act
      const count = await sut.sweepBankPaymentConfirmation();

      // Assert
      expect(queueProducer.addConfirmBankPaymentJob).toHaveBeenCalledWith({ nfseId: 9 });
      expect(count).toBe(1);
    });
  });
});
