import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Job, UnrecoverableError } from 'bullmq';
import { AppException } from 'src/core/filters/app.exception';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { PermanentProviderError } from 'src/shared/errors/permanent-provider.error';
import { TransientProviderError } from 'src/shared/errors/transient-provider.error';
import type { IssueNfseBankPaymentJobDto } from '../../../../application/queue/jobs/issue-nfse-bank-payment-job.dto';
import type { IssueNfseBatchJobDto } from '../../../../application/queue/jobs/issue-nfse-batch-job.dto';
import type { PollNfseBatchJobDto } from '../../../../application/queue/jobs/poll-nfse-batch-job.dto';
import { ProcessIssueNfseBankPayment } from '../../../../application/usecases/process-issue-nfse-bank-payment/process-issue-nfse-bank-payment.service';
import { ProcessIssueNfseBatch } from '../../../../application/usecases/process-issue-nfse-batch/process-issue-nfse-batch.service';
import { ProcessPollNfseBatch } from '../../../../application/usecases/process-poll-nfse-batch/process-poll-nfse-batch.service';
import { NfseBullmqConsumer } from './nfse-bullmq.consumer';

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

describe('NfseBullmqConsumer', () => {
  let sut: NfseBullmqConsumer;
  let processIssueNfseBatch: ProcessIssueNfseBatch;
  let processPollNfseBatch: ProcessPollNfseBatch;
  let processIssueNfseBankPayment: ProcessIssueNfseBankPayment;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        NfseBullmqConsumer,
        { provide: ProcessIssueNfseBatch, useValue: createMock<ProcessIssueNfseBatch>() },
        { provide: ProcessPollNfseBatch, useValue: createMock<ProcessPollNfseBatch>() },
        { provide: ProcessIssueNfseBankPayment, useValue: createMock<ProcessIssueNfseBankPayment>() },
      ],
    }).compile();

    sut = module.get(NfseBullmqConsumer);
    processIssueNfseBatch = module.get(ProcessIssueNfseBatch);
    processPollNfseBatch = module.get(ProcessPollNfseBatch);
    processIssueNfseBankPayment = module.get(ProcessIssueNfseBankPayment);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('process', () => {
    it('should delegate issue-nfse-batch jobs to ProcessIssueNfseBatch', async() => {
      // Arrange
      const payload = makeIssueBatchJob({ nfseId: 42 });
      const executeSpy = jest.spyOn(processIssueNfseBatch, 'execute').mockResolvedValue();

      // Act
      await sut.process(makeJob(JobName.IssueNfseBatch, payload));

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
      await sut.process(makeJob(JobName.PollNfseBatch, payload));

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
      await sut.process(makeJob(JobName.IssueNfseBankPayment, payload));

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
      const error = await sut.process(job).catch((e: unknown) => e);

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
      await expect(sut.process(makeJob(JobName.IssueNfseBatch, payload))).rejects.toBe(err);
    });

    it('should propagate ProcessPollNfseBatch errors', async() => {
      // Arrange
      const payload = makePollBatchJob();
      const err = new Error('poll failed');
      jest.spyOn(processPollNfseBatch, 'execute').mockRejectedValue(err);

      // Act & Assert
      await expect(sut.process(makeJob(JobName.PollNfseBatch, payload))).rejects.toBe(err);
    });

    it('should propagate ProcessIssueNfseBankPayment errors', async() => {
      // Arrange
      const payload = makeIssueBankPaymentJob();
      const err = new Error('bank payment failed');
      jest.spyOn(processIssueNfseBankPayment, 'execute').mockRejectedValue(err);

      // Act & Assert
      await expect(sut.process(makeJob(JobName.IssueNfseBankPayment, payload))).rejects.toBe(err);
    });

    it('should convert PermanentProviderError from the bank-payment job into UnrecoverableError', async() => {
      // Arrange
      const payload = makeIssueBankPaymentJob();
      jest.spyOn(processIssueNfseBankPayment, 'execute')
        .mockRejectedValue(new PermanentProviderError('Vencimento inválido.'));

      // Act
      const error = await sut.process(makeJob(JobName.IssueNfseBankPayment, payload)).catch((e: unknown) => e);

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
      await expect(sut.process(makeJob(JobName.IssueNfseBankPayment, payload))).rejects.toBe(err);
    });

    it('should convert PermanentProviderError from the issue-batch job into UnrecoverableError', async() => {
      // Arrange
      jest.spyOn(processIssueNfseBatch, 'execute')
        .mockRejectedValue(new PermanentProviderError('certificado recusado'));

      // Act
      const error = await sut.process(makeJob(JobName.IssueNfseBatch, makeIssueBatchJob()))
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
      const error = await sut.process(makeJob(JobName.PollNfseBatch, makePollBatchJob()))
        .catch((e: unknown) => e);

      // Assert
      expect(error).toBeInstanceOf(UnrecoverableError);
      expect((error as Error).message).toBe('certificado recusado');
    });
  });
});
