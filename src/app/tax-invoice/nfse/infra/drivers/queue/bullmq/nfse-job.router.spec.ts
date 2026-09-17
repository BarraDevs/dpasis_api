import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { DelayedError, Job, UnrecoverableError } from 'bullmq';
import { AppException } from 'src/core/filters/app.exception';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { PermanentProviderError } from 'src/shared/errors/permanent-provider.error';
import { RetryScheduledError } from 'src/shared/errors/retry-scheduled.error';
import { TransientProviderError } from 'src/shared/errors/transient-provider.error';
import type { IssueNfseBankPaymentJobDto } from '../../../../application/queue/jobs/issue-nfse-bank-payment-job.dto';
import type { IssueNfseBatchJobDto } from '../../../../application/queue/jobs/issue-nfse-batch-job.dto';
import type { PollNfseBatchJobDto } from '../../../../application/queue/jobs/poll-nfse-batch-job.dto';
import { ProcessIssueNfseBankPayment } from '../../../../application/usecases/process-issue-nfse-bank-payment/process-issue-nfse-bank-payment.service';
import { ProcessIssueNfseBatch } from '../../../../application/usecases/process-issue-nfse-batch/process-issue-nfse-batch.service';
import { ProcessPollNfseBatch } from '../../../../application/usecases/process-poll-nfse-batch/process-poll-nfse-batch.service';
import { ConfirmNfseBankPayment } from '../../../../application/usecases/confirm-nfse-bank-payment/confirm-nfse-bank-payment.service';
import { ReconcileNfse } from '../../../../application/usecases/reconcile-nfse/reconcile-nfse.service';
import { SettleNfseBankPayment } from '../../../../application/usecases/settle-nfse-bank-payment/settle-nfse-bank-payment.service';
import { NfseJobRouter } from './nfse-job.router';

function makeJob<T>(name: string, data: T): Job<T> {
  return { name, data } as Job<T>;
}

function makeIssueBatchJob(overrides: Partial<IssueNfseBatchJobDto> = {}): IssueNfseBatchJobDto {
  return { nfseId: 1, ...overrides };
}

function makePollBatchJob(overrides: Partial<PollNfseBatchJobDto> = {}): PollNfseBatchJobDto {
  return { nfseId: 1, attempt: 1, ...overrides };
}

function makeIssueBankPaymentJob(overrides: Partial<IssueNfseBankPaymentJobDto> = {}): IssueNfseBankPaymentJobDto {
  return { nfseId: 1, ...overrides };
}

describe('NfseJobRouter', () => {
  let sut: NfseJobRouter;
  let processIssueNfseBatch: ProcessIssueNfseBatch;
  let processPollNfseBatch: ProcessPollNfseBatch;
  let processIssueNfseBankPayment: ProcessIssueNfseBankPayment;
  let reconcileNfse: ReconcileNfse;
  let confirmNfseBankPayment: ConfirmNfseBankPayment;
  let settleNfseBankPayment: SettleNfseBankPayment;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        NfseJobRouter,
        { provide: ProcessIssueNfseBatch, useValue: createMock<ProcessIssueNfseBatch>() },
        { provide: ProcessPollNfseBatch, useValue: createMock<ProcessPollNfseBatch>() },
        { provide: ProcessIssueNfseBankPayment, useValue: createMock<ProcessIssueNfseBankPayment>() },
        { provide: ReconcileNfse, useValue: createMock<ReconcileNfse>() },
        { provide: ConfirmNfseBankPayment, useValue: createMock<ConfirmNfseBankPayment>() },
        { provide: SettleNfseBankPayment, useValue: createMock<SettleNfseBankPayment>() },
      ],
    }).compile();

    sut = module.get(NfseJobRouter);
    processIssueNfseBatch = module.get(ProcessIssueNfseBatch);
    processPollNfseBatch = module.get(ProcessPollNfseBatch);
    reconcileNfse = module.get(ReconcileNfse);
    confirmNfseBankPayment = module.get(ConfirmNfseBankPayment);
    settleNfseBankPayment = module.get(SettleNfseBankPayment);
    processIssueNfseBankPayment = module.get(ProcessIssueNfseBankPayment);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('run', () => {
    it('should delegate issue-nfse-batch jobs to ProcessIssueNfseBatch', async() => {
      // Arrange
      const payload = makeIssueBatchJob({ nfseId: 42 });
      const executeSpy = jest.spyOn(processIssueNfseBatch, 'execute').mockResolvedValue();

      // Act
      await sut.run(makeJob(JobName.IssueNfseBatch, payload));

      // Assert
      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(executeSpy).toHaveBeenCalledWith(payload);
      expect(processPollNfseBatch.execute).not.toHaveBeenCalled();
      expect(processIssueNfseBankPayment.execute).not.toHaveBeenCalled();
    });

    it('should delegate poll-nfse-batch jobs to ProcessPollNfseBatch', async() => {
      // Arrange
      const payload = makePollBatchJob({ nfseId: 7, attempt: 3 });
      const executeSpy = jest.spyOn(processPollNfseBatch, 'execute').mockResolvedValue();

      // Act
      await sut.run(makeJob(JobName.PollNfseBatch, payload));

      // Assert
      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(executeSpy).toHaveBeenCalledWith(payload);
      expect(processIssueNfseBatch.execute).not.toHaveBeenCalled();
      expect(processIssueNfseBankPayment.execute).not.toHaveBeenCalled();
    });

    it('should delegate issue-nfse-bank-payment jobs to ProcessIssueNfseBankPayment', async() => {
      // Arrange
      const payload = makeIssueBankPaymentJob({ nfseId: 99 });
      const executeSpy = jest.spyOn(processIssueNfseBankPayment, 'execute').mockResolvedValue(null);

      // Act
      await sut.run(makeJob(JobName.IssueNfseBankPayment, payload));

      // Assert
      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(executeSpy).toHaveBeenCalledWith(payload);
      expect(processIssueNfseBatch.execute).not.toHaveBeenCalled();
      expect(processPollNfseBatch.execute).not.toHaveBeenCalled();
    });

    it('should throw AppException for unknown job name', async() => {
      // Arrange
      const job = { name: 'unknown-job', data: {} } as Job<IssueNfseBatchJobDto | PollNfseBatchJobDto | IssueNfseBankPaymentJobDto>;

      // Act
      const error = await sut.run(job).catch((e: unknown) => e);

      // Assert
      expect(error).toBeInstanceOf(AppException);
      expect((error as Error).message).toBe('Unknown job name: unknown-job');
      expect(processIssueNfseBatch.execute).not.toHaveBeenCalled();
      expect(processPollNfseBatch.execute).not.toHaveBeenCalled();
      expect(processIssueNfseBankPayment.execute).not.toHaveBeenCalled();
    });

    it('should propagate ProcessIssueNfseBatch errors', async() => {
      // Arrange
      const payload = makeIssueBatchJob();
      const err = new Error('issue failed');
      jest.spyOn(processIssueNfseBatch, 'execute').mockRejectedValue(err);

      // Act & Assert
      await expect(sut.run(makeJob(JobName.IssueNfseBatch, payload))).rejects.toBe(err);
    });

    it('should propagate ProcessPollNfseBatch errors', async() => {
      // Arrange
      const payload = makePollBatchJob();
      const err = new Error('poll failed');
      jest.spyOn(processPollNfseBatch, 'execute').mockRejectedValue(err);

      // Act & Assert
      await expect(sut.run(makeJob(JobName.PollNfseBatch, payload))).rejects.toBe(err);
    });

    it('should propagate ProcessIssueNfseBankPayment errors', async() => {
      // Arrange
      const payload = makeIssueBankPaymentJob();
      const err = new Error('bank payment failed');
      jest.spyOn(processIssueNfseBankPayment, 'execute').mockRejectedValue(err);

      // Act & Assert
      await expect(sut.run(makeJob(JobName.IssueNfseBankPayment, payload))).rejects.toBe(err);
    });

    it('should convert PermanentProviderError from the bank-payment job into UnrecoverableError', async() => {
      // Arrange
      const payload = makeIssueBankPaymentJob();
      jest.spyOn(processIssueNfseBankPayment, 'execute')
        .mockRejectedValue(new PermanentProviderError('Vencimento inválido.'));

      // Act
      const error = await sut.run(makeJob(JobName.IssueNfseBankPayment, payload)).catch((e: unknown) => e);

      // Assert
      expect(error).toBeInstanceOf(UnrecoverableError);
      expect((error as Error).message).toBe('Vencimento inválido.');
    });

    it('should keep TransientProviderError retryable', async() => {
      // Arrange
      const payload = makeIssueBankPaymentJob();
      const err = new TransientProviderError('Banco Inter respondeu com erro 500.');
      jest.spyOn(processIssueNfseBankPayment, 'execute').mockRejectedValue(err);

      // Act & Assert
      await expect(sut.run(makeJob(JobName.IssueNfseBankPayment, payload))).rejects.toBe(err);
    });

    it('should convert PermanentProviderError from the issue-batch job into UnrecoverableError', async() => {
      // Arrange
      jest.spyOn(processIssueNfseBatch, 'execute')
        .mockRejectedValue(new PermanentProviderError('certificado recusado'));

      // Act
      const error = await sut.run(makeJob(JobName.IssueNfseBatch, makeIssueBatchJob()))
        .catch((e: unknown) => e);

      // Assert
      expect(error).toBeInstanceOf(UnrecoverableError);
      expect((error as Error).message).toBe('certificado recusado');
    });

    it('should convert PermanentProviderError from the poll-batch job into UnrecoverableError', async() => {
      // Arrange
      jest.spyOn(processPollNfseBatch, 'execute')
        .mockRejectedValue(new PermanentProviderError('certificado recusado'));

      // Act
      const error = await sut.run(makeJob(JobName.PollNfseBatch, makePollBatchJob()))
        .catch((e: unknown) => e);

      // Assert
      expect(error).toBeInstanceOf(UnrecoverableError);
      expect((error as Error).message).toBe('certificado recusado');
    });
  });
  describe('run (jobs da Onda 3)', () => {
    it('should delegate reconcile-nfse jobs to ReconcileNfse', async() => {
      // Arrange
      const job = makeJob(JobName.ReconcileNfse, { nfseId: 7 });

      // Act
      await sut.run(job);

      // Assert
      expect(reconcileNfse.execute).toHaveBeenCalledWith({ nfseId: 7 });
    });

    it('should delegate confirm-nfse-bank-payment jobs to ConfirmNfseBankPayment', async() => {
      // Arrange
      const job = makeJob(JobName.ConfirmNfseBankPayment, { nfseId: 9 });

      // Act
      await sut.run(job);

      // Assert
      expect(confirmNfseBankPayment.execute).toHaveBeenCalledWith({ nfseId: 9 });
    });

    it('should delegate settle-nfse-bank-payment jobs to SettleNfseBankPayment', async() => {
      // Arrange
      const job = makeJob(JobName.SettleNfseBankPayment, { nfseId: 11 });

      // Act
      await sut.run(job);

      // Assert
      expect(settleNfseBankPayment.execute).toHaveBeenCalledWith({ nfseId: 11 });
    });

    it('should convert PermanentProviderError from the reconcile job into UnrecoverableError', async() => {
      // Arrange
      jest.spyOn(reconcileNfse, 'execute').mockRejectedValue(new PermanentProviderError('config inválida'));

      // Act & Assert
      await expect(sut.run(makeJob(JobName.ReconcileNfse, { nfseId: 7 }))).rejects.toThrow(UnrecoverableError);
    });
  });

  describe('run (Retry-After)', () => {
    function makeDelayableJob(name: string): { job: Job<IssueNfseBankPaymentJobDto>; moveToDelayed: jest.Mock } {
      const moveToDelayed = jest.fn().mockResolvedValue(undefined);
      return {
        job: { name, data: makeIssueBankPaymentJob(), moveToDelayed } as unknown as Job<IssueNfseBankPaymentJobDto>,
        moveToDelayed,
      };
    }

    it('should reschedule the job instead of burning an attempt when the provider sent Retry-After', async() => {
      // Arrange
      const { job, moveToDelayed } = makeDelayableJob(JobName.IssueNfseBankPayment);
      jest.spyOn(processIssueNfseBankPayment, 'execute')
        .mockRejectedValue(new TransientProviderError('Banco Inter respondeu com 429.', 90));
      jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

      // Act
      const error = await sut.run(job, 'token-1').catch((e: unknown) => e);

      // Assert
      expect(moveToDelayed).toHaveBeenCalledWith(1_000_000 + 90_000, 'token-1');
      expect(error).toBeInstanceOf(DelayedError);
    });

    it('should keep burning attempts when there is no token to hold the job lock', async() => {
      // Arrange
      const { job, moveToDelayed } = makeDelayableJob(JobName.IssueNfseBankPayment);
      const err = new TransientProviderError('Banco Inter respondeu com 429.', 90);
      jest.spyOn(processIssueNfseBankPayment, 'execute').mockRejectedValue(err);

      // Act & Assert
      await expect(sut.run(job)).rejects.toBe(err);
      expect(moveToDelayed).not.toHaveBeenCalled();
    });
  });

  describe('run (retentativa agendada pela aplicação)', () => {
    it('should complete the job when the use case already scheduled its own retry', async() => {
      // Arrange
      const moveToDelayed = jest.fn();
      const job = {
        name: JobName.IssueNfseBankPayment,
        data: makeIssueBankPaymentJob(),
        moveToDelayed,
      } as unknown as Job<IssueNfseBankPaymentJobDto>;
      jest.spyOn(processIssueNfseBankPayment, 'execute').mockRejectedValue(
        new RetryScheduledError('Banco Inter indisponível.', new Date('2026-09-10T15:00:00Z')),
      );

      // Act & Assert — nem retry do BullMQ nem fila de falhas: a varredura retoma no horário agendado.
      await expect(sut.run(job, 'token-1')).resolves.toBeUndefined();
      expect(moveToDelayed).not.toHaveBeenCalled();
    });
  });
});
