import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import type { IssueNfseBatchJobDto } from '../../../../application/queue/jobs/issue-nfse-batch-job.dto';
import type { PollNfseBatchJobDto } from '../../../../application/queue/jobs/poll-nfse-batch-job.dto';
import { NfseQueueBullmqAdapterProducer } from './nfse-queue-bullmq.producer';

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
        {
          provide: getQueueToken(QueueName.Nfse),
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
    it('should enqueue issue batch job with payload', async() => {
      // Arrange
      const data = makeIssueBatchJob({ nfseId: 42 });

      // Act
      await sut.addIssueBatchJob(data);

      // Assert
      expect(queueAdd).toHaveBeenCalledTimes(1);
      expect(queueAdd).toHaveBeenCalledWith(JobName.IssueNfseBatch, data);
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
      expect(queueAdd).toHaveBeenCalledWith(JobName.PollNfseBatch, data, { delay: 30_000 });
    });

    it('should enqueue poll batch job with undefined delay when options are omitted', async() => {
      // Arrange
      const data = makePollBatchJob();

      // Act
      await sut.addPollBatchJob(data);

      // Assert
      expect(queueAdd).toHaveBeenCalledTimes(1);
      expect(queueAdd).toHaveBeenCalledWith(JobName.PollNfseBatch, data, { delay: undefined });
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
});
