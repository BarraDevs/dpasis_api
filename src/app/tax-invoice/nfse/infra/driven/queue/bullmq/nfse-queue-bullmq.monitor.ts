import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import type { INfseQueueMonitor } from '../../../../application/queue/nfse-queue-monitor.interface';
import { QueueDepthDto } from '../../../../application/usecases/get-nfse-metrics/dtos/get-nfse-metrics.dto';

@Injectable()
export class NfseQueueBullmqAdapterMonitor implements INfseQueueMonitor {
  constructor(
    @InjectQueue(QueueName.NfseIssue) private readonly issueQueue: Queue,
    @InjectQueue(QueueName.NfsePoll) private readonly pollQueue: Queue,
    @InjectQueue(QueueName.NfseBankPayment) private readonly bankPaymentQueue: Queue,
  ) {}

  public async getDepth(): Promise<QueueDepthDto[]> {
    const queues = [this.issueQueue, this.pollQueue, this.bankPaymentQueue];

    return Promise.all(queues.map(async(queue) => {
      const counts = await queue.getJobCounts('waiting', 'active', 'delayed', 'failed');

      return {
        queue: queue.name,
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        delayed: counts.delayed ?? 0,
        failed: counts.failed ?? 0,
      };
    }));
  }
}
