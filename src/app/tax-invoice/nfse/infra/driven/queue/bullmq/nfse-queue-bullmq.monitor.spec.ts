import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import { NfseQueueBullmqAdapterMonitor } from './nfse-queue-bullmq.monitor';

function makeQueue(name: string, counts: Record<string, number>) {
  return { name, getJobCounts: jest.fn().mockResolvedValue(counts) };
}

describe('NfseQueueBullmqAdapterMonitor - Unit tests', () => {
  it('should report the depth of every queue in the flow', async() => {
    // Arrange
    const issue = makeQueue(QueueName.NfseIssue, { waiting: 3, active: 1, delayed: 12, failed: 0 });
    const poll = makeQueue(QueueName.NfsePoll, { waiting: 40, active: 6, delayed: 200, failed: 2 });
    const bankPayment = makeQueue(QueueName.NfseBankPayment, { waiting: 0, active: 0, delayed: 0, failed: 0 });

    const module = await Test.createTestingModule({
      providers: [
        NfseQueueBullmqAdapterMonitor,
        { provide: getQueueToken(QueueName.NfseIssue), useValue: issue },
        { provide: getQueueToken(QueueName.NfsePoll), useValue: poll },
        { provide: getQueueToken(QueueName.NfseBankPayment), useValue: bankPayment },
      ],
    }).compile();

    // Act
    const result = await module.get(NfseQueueBullmqAdapterMonitor).getDepth();

    // Assert
    expect(result).toEqual([
      { queue: QueueName.NfseIssue, waiting: 3, active: 1, delayed: 12, failed: 0 },
      { queue: QueueName.NfsePoll, waiting: 40, active: 6, delayed: 200, failed: 2 },
      { queue: QueueName.NfseBankPayment, waiting: 0, active: 0, delayed: 0, failed: 0 },
    ]);
    expect(issue.getJobCounts).toHaveBeenCalledWith('waiting', 'active', 'delayed', 'failed');
  });

  it('should default missing counters to zero', async() => {
    // Arrange — `getJobCounts` devolve só o que existe no Redis.
    const empty = makeQueue(QueueName.NfseIssue, {});

    const module = await Test.createTestingModule({
      providers: [
        NfseQueueBullmqAdapterMonitor,
        { provide: getQueueToken(QueueName.NfseIssue), useValue: empty },
        { provide: getQueueToken(QueueName.NfsePoll), useValue: makeQueue(QueueName.NfsePoll, {}) },
        { provide: getQueueToken(QueueName.NfseBankPayment), useValue: makeQueue(QueueName.NfseBankPayment, {}) },
      ],
    }).compile();

    // Act
    const result = await module.get(NfseQueueBullmqAdapterMonitor).getDepth();

    // Assert
    expect(result[0]).toEqual({ queue: QueueName.NfseIssue, waiting: 0, active: 0, delayed: 0, failed: 0 });
  });
});
