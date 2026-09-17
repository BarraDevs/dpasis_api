import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import type { IssueNfseBatchJobDto } from '../../../../application/queue/jobs/issue-nfse-batch-job.dto';
import type { PollNfseBatchJobDto } from '../../../../application/queue/jobs/poll-nfse-batch-job.dto';
import { NfseQueueBullmqAdapterProducer } from './nfse-queue-bullmq.producer';

const EXPECTED_RETRY = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 30_000 },
};

function makeIssueBatchJob(overrides: Partial<IssueNfseBatchJobDto> = {}): IssueNfseBatchJobDto {
  return { nfseId: 1, ...overrides };
}

function makePollBatchJob(overrides: Partial<PollNfseBatchJobDto> = {}): PollNfseBatchJobDto {
  return { nfseId: 1, attempt: 1, ...overrides };
}

describe('NfseQueueBullmqAdapterProducer', () => {
  let sut: NfseQueueBullmqAdapterProducer;
  const queueAdd = jest.fn().mockResolvedValue(undefined);

  beforeEach(async() => {
    queueAdd.mockClear().mockResolvedValue(undefined);

    const module = await Test.createTestingModule({
      providers: [
        NfseQueueBullmqAdapterProducer,
        // As três filas compartilham o mesmo mock aqui: estes casos verificam payload e retry.
        // Quem verifica em qual fila cada job cai é o bloco "roteamento por fila".
        {
          provide: getQueueToken(QueueName.NfseIssue),
          useValue: { add: queueAdd },
        },
        {
          provide: getQueueToken(QueueName.NfsePoll),
          useValue: { add: queueAdd },
        },
        {
          provide: getQueueToken(QueueName.NfseBankPayment),
          useValue: { add: queueAdd },
        },
      ],
    }).compile();

    sut = module.get(NfseQueueBullmqAdapterProducer);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('addIssueBatchJob', () => {
    it('should enqueue issue batch job with payload and retry options', async() => {
      // Arrange
      const data = makeIssueBatchJob({ nfseId: 42 });

      // Act
      await sut.addIssueBatchJob(data);

      // Assert
      expect(queueAdd).toHaveBeenCalledTimes(1);
      expect(queueAdd).toHaveBeenCalledWith(JobName.IssueNfseBatch, data, EXPECTED_RETRY);
    });

    it('should propagate queue.add errors', async() => {
      // Arrange
      const data = makeIssueBatchJob();
      const err = new Error('Redis down');
      queueAdd.mockRejectedValueOnce(err);

      // Act & Assert
      await expect(sut.addIssueBatchJob(data)).rejects.toBe(err);
    });
  });

  describe('addPollBatchJob', () => {
    it('should enqueue poll batch job with delay when options are provided', async() => {
      // Arrange
      const data = makePollBatchJob({ nfseId: 7, attempt: 2 });
      const options = { delayMs: 30_000 };

      // Act
      await sut.addPollBatchJob(data, options);

      // Assert
      expect(queueAdd).toHaveBeenCalledTimes(1);
      expect(queueAdd).toHaveBeenCalledWith(JobName.PollNfseBatch, data, { ...EXPECTED_RETRY, delay: 30_000 });
    });

    it('should enqueue poll batch job with undefined delay when options are omitted', async() => {
      // Arrange
      const data = makePollBatchJob();

      // Act
      await sut.addPollBatchJob(data);

      // Assert
      expect(queueAdd).toHaveBeenCalledTimes(1);
      expect(queueAdd).toHaveBeenCalledWith(JobName.PollNfseBatch, data, { ...EXPECTED_RETRY, delay: undefined });
    });

    it('should propagate queue.add errors', async() => {
      // Arrange
      const data = makePollBatchJob();
      const err = new Error('Redis down');
      queueAdd.mockRejectedValueOnce(err);

      // Act & Assert
      await expect(sut.addPollBatchJob(data)).rejects.toBe(err);
    });
  });

  describe('addIssueBankPaymentJob', () => {
    it('should enqueue bank payment job with retry options', async() => {
      // Arrange
      const data = { nfseId: 55 };

      // Act
      await sut.addIssueBankPaymentJob(data);

      // Assert
      expect(queueAdd).toHaveBeenCalledTimes(1);
      expect(queueAdd).toHaveBeenCalledWith(JobName.IssueNfseBankPayment, data, {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
      });
    });

    it('should propagate queue.add errors', async() => {
      // Arrange
      const data = { nfseId: 55 };
      const err = new Error('Redis down');
      queueAdd.mockRejectedValueOnce(err);

      // Act & Assert
      await expect(sut.addIssueBankPaymentJob(data)).rejects.toBe(err);
    });
  });
  describe('addReconcileNfseJob', () => {
    it('should enqueue reconcile-nfse with a short, spaced retry', async() => {
      // Act — a consulta é idempotente; quem insiste de verdade é a varredura.
      await sut.addReconcileNfseJob({ nfseId: 7 });

      // Assert
      expect(queueAdd).toHaveBeenCalledWith(JobName.ReconcileNfse, { nfseId: 7 }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60_000 },
      });
    });
  });

  describe('addConfirmBankPaymentJob', () => {
    it('should enqueue confirm-nfse-bank-payment with the same policy', async() => {
      // Act
      await sut.addConfirmBankPaymentJob({ nfseId: 9 });

      // Assert
      expect(queueAdd).toHaveBeenCalledWith(JobName.ConfirmNfseBankPayment, { nfseId: 9 }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60_000 },
      });
    });
  });

  describe('addSettleBankPaymentJob', () => {
    it('should enqueue settle-nfse-bank-payment with the same policy', async() => {
      // Act
      await sut.addSettleBankPaymentJob({ nfseId: 11 });

      // Assert
      expect(queueAdd).toHaveBeenCalledWith(JobName.SettleNfseBankPayment, { nfseId: 11 }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60_000 },
      });
    });
  });

  describe('roteamento por fila', () => {
    async function buildWithSeparateQueues(): Promise<{
      producer: NfseQueueBullmqAdapterProducer;
      issueAdd: jest.Mock;
      pollAdd: jest.Mock;
      bankPaymentAdd: jest.Mock;
    }> {
      const issueAdd = jest.fn().mockResolvedValue(undefined);
      const pollAdd = jest.fn().mockResolvedValue(undefined);
      const bankPaymentAdd = jest.fn().mockResolvedValue(undefined);

      const module = await Test.createTestingModule({
        providers: [
          NfseQueueBullmqAdapterProducer,
          { provide: getQueueToken(QueueName.NfseIssue), useValue: { add: issueAdd } },
          { provide: getQueueToken(QueueName.NfsePoll), useValue: { add: pollAdd } },
          { provide: getQueueToken(QueueName.NfseBankPayment), useValue: { add: bankPaymentAdd } },
        ],
      }).compile();

      return { producer: module.get(NfseQueueBullmqAdapterProducer), issueAdd, pollAdd, bankPaymentAdd };
    }

    it('should send the RPS batch to the issue queue only', async() => {
      // Arrange
      const { producer, issueAdd, pollAdd, bankPaymentAdd } = await buildWithSeparateQueues();

      // Act
      await producer.addIssueBatchJob(makeIssueBatchJob());

      // Assert
      expect(issueAdd).toHaveBeenCalledTimes(1);
      expect(pollAdd).not.toHaveBeenCalled();
      expect(bankPaymentAdd).not.toHaveBeenCalled();
    });

    it('should send batch polling and reconciliation to the poll queue', async() => {
      // Arrange
      const { producer, issueAdd, pollAdd, bankPaymentAdd } = await buildWithSeparateQueues();

      // Act
      await producer.addPollBatchJob(makePollBatchJob());
      await producer.addReconcileNfseJob({ nfseId: 1 });

      // Assert
      expect(pollAdd).toHaveBeenCalledTimes(2);
      expect(issueAdd).not.toHaveBeenCalled();
      expect(bankPaymentAdd).not.toHaveBeenCalled();
    });

    it('should send bank payment jobs to the bank payment queue', async() => {
      // Arrange
      const { producer, issueAdd, pollAdd, bankPaymentAdd } = await buildWithSeparateQueues();

      // Act
      await producer.addIssueBankPaymentJob({ nfseId: 1 });
      await producer.addConfirmBankPaymentJob({ nfseId: 1 });
      await producer.addSettleBankPaymentJob({ nfseId: 1 });

      // Assert
      expect(bankPaymentAdd).toHaveBeenCalledTimes(3);
      expect(issueAdd).not.toHaveBeenCalled();
      expect(pollAdd).not.toHaveBeenCalled();
    });
  });
});
