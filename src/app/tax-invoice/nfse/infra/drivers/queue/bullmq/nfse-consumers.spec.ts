import { createMock } from '@golevelup/ts-jest';
import { Job } from 'bullmq';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import { NfseBankPaymentBullmqConsumer } from './nfse-bank-payment-bullmq.consumer';
import { NfseIssueBullmqConsumer } from './nfse-issue-bullmq.consumer';
import type { NfseJobData } from './nfse-job.router';
import { NfseJobRouter } from './nfse-job.router';
import { NfsePollBullmqConsumer } from './nfse-poll-bullmq.consumer';

const PROCESSOR_METADATA = 'bullmq:processor_metadata';
const WORKER_METADATA = 'bullmq:worker_metadata';

type WorkerMetadata = {
  concurrency?: number;
  limiter?: { max: number; duration: number };
};

function queueOf(target: object): string {
  return (Reflect.getMetadata(PROCESSOR_METADATA, target) as { name: string }).name;
}

function workerOptionsOf(target: object): WorkerMetadata {
  return (Reflect.getMetadata(WORKER_METADATA, target) as WorkerMetadata | undefined) ?? {};
}

describe('Consumers da NFS-e', () => {
  const job = { name: 'any-job', data: { nfseId: 1 } } as Job<NfseJobData>;

  describe('NfseIssueBullmqConsumer', () => {
    it('should consume the issue queue with low concurrency and a conservative limiter', () => {
      // Act
      const options = workerOptionsOf(NfseIssueBullmqConsumer);

      // Assert
      expect(queueOf(NfseIssueBullmqConsumer)).toBe(QueueName.NfseIssue);
      expect(options.concurrency).toBe(2);
      expect(options.limiter).toEqual({ max: 30, duration: 60_000 });
    });

    it('should delegate the job to the router with the lock token', async() => {
      // Arrange
      const router = createMock<NfseJobRouter>();
      const sut = new NfseIssueBullmqConsumer(router);

      // Act
      await sut.process(job, 'token-1');

      // Assert
      expect(router.run).toHaveBeenCalledWith(job, 'token-1');
    });
  });

  describe('NfsePollBullmqConsumer', () => {
    it('should consume the poll queue with room for a whole closing day', () => {
      // Act
      const options = workerOptionsOf(NfsePollBullmqConsumer);

      // Assert
      expect(queueOf(NfsePollBullmqConsumer)).toBe(QueueName.NfsePoll);
      expect(options.concurrency).toBe(6);
      expect(options.limiter).toEqual({ max: 120, duration: 60_000 });
    });

    it('should delegate the job to the router with the lock token', async() => {
      // Arrange
      const router = createMock<NfseJobRouter>();
      const sut = new NfsePollBullmqConsumer(router);

      // Act
      await sut.process(job, 'token-2');

      // Assert
      expect(router.run).toHaveBeenCalledWith(job, 'token-2');
    });
  });

  describe('NfseBankPaymentBullmqConsumer', () => {
    it('should consume the bank payment queue under the Inter rate limit', () => {
      // Act
      const options = workerOptionsOf(NfseBankPaymentBullmqConsumer);

      // Assert
      expect(queueOf(NfseBankPaymentBullmqConsumer)).toBe(QueueName.NfseBankPayment);
      expect(options.concurrency).toBe(6);
      expect(options.limiter).toEqual({ max: 100, duration: 60_000 });
    });

    it('should delegate the job to the router with the lock token', async() => {
      // Arrange
      const router = createMock<NfseJobRouter>();
      const sut = new NfseBankPaymentBullmqConsumer(router);

      // Act
      await sut.process(job, 'token-3');

      // Assert
      expect(router.run).toHaveBeenCalledWith(job, 'token-3');
    });
  });
});
