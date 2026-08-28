import { JobName } from 'src/infra/queue/enums/job-name.enum';
import type { IssueNfseBatchJobDto } from '../../../../application/queue/jobs/issue-nfse-batch-job.dto';
import type { PollNfseBatchJobDto } from '../../../../application/queue/jobs/poll-nfse-batch-job.dto';
import { NfseQueueFakeAdapterProducer } from './nfse-queue-fake.producer';

function makeIssueBatchJob(overrides: Partial<IssueNfseBatchJobDto> = {}): IssueNfseBatchJobDto {
  return { nfseId: 1, ...overrides };
}

function makePollBatchJob(overrides: Partial<PollNfseBatchJobDto> = {}): PollNfseBatchJobDto {
  return { nfseId: 1, attempt: 1, ...overrides };
}

describe('NfseQueueFakeAdapterProducer - Unit tests', () => {
  let sut: NfseQueueFakeAdapterProducer;

  beforeEach(() => {
    sut = new NfseQueueFakeAdapterProducer();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should start with empty job arrays', () => {
    expect(sut.addedIssueBatchJobs).toEqual([]);
    expect(sut.addedPollBatchJobs).toEqual([]);
    expect(sut.addedIssueBankPaymentJobs).toEqual([]);
  });

  describe('addIssueBatchJob', () => {
    it('should append the issue batch job with the correct name and payload', async() => {
      // Arrange
      const data = makeIssueBatchJob({ nfseId: 42 });

      // Act
      await sut.addIssueBatchJob(data);

      // Assert
      expect(sut.addedIssueBatchJobs).toEqual([
        { name: JobName.IssueNfseBatch, data },
      ]);
    });

    it('should accumulate multiple issue batch jobs', async() => {
      // Arrange
      const first = makeIssueBatchJob({ nfseId: 1 });
      const second = makeIssueBatchJob({ nfseId: 2 });

      // Act
      await sut.addIssueBatchJob(first);
      await sut.addIssueBatchJob(second);

      // Assert
      expect(sut.addedIssueBatchJobs).toHaveLength(2);
      expect(sut.addedIssueBatchJobs[1]).toEqual({ name: JobName.IssueNfseBatch, data: second });
    });
  });

  describe('addPollBatchJob', () => {
    it('should append the poll batch job with options when provided', async() => {
      // Arrange
      const data = makePollBatchJob({ nfseId: 7, attempt: 3 });
      const options = { delayMs: 30_000 };

      // Act
      await sut.addPollBatchJob(data, options);

      // Assert
      expect(sut.addedPollBatchJobs).toEqual([
        { name: JobName.PollNfseBatch, data, options },
      ]);
    });

    it('should append the poll batch job without options when omitted', async() => {
      // Arrange
      const data = makePollBatchJob();

      // Act
      await sut.addPollBatchJob(data);

      // Assert
      expect(sut.addedPollBatchJobs).toEqual([
        { name: JobName.PollNfseBatch, data, options: undefined },
      ]);
    });
  });

  describe('addIssueBankPaymentJob', () => {
    it('should append the bank payment job with the correct name and payload', async() => {
      // Arrange
      const data = { nfseId: 55 };

      // Act
      await sut.addIssueBankPaymentJob(data);

      // Assert
      expect(sut.addedIssueBankPaymentJobs).toEqual([
        { name: JobName.IssueNfseBankPayment, data },
      ]);
    });
  });
});
