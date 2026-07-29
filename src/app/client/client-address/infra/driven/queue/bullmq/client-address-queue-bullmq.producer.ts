import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import type { ResolveClientAddressIbgeCodeJobDto } from '../../../../application/queue/jobs/resolve-client-address-ibge-code-job.dto';
import type { IClientAddressQueueProducer } from '../../../../application/queue/client-address-queue-producer.interface';

@Injectable()
export class ClientAddressQueueBullmqAdapterProducer implements IClientAddressQueueProducer {
  constructor(
    @InjectQueue(QueueName.ClientAddress) private readonly queue: Queue,
  ) {}

  public async addResolveIbgeCodeJob(data: ResolveClientAddressIbgeCodeJobDto): Promise<void> {
    await this.queue.add(JobName.ResolveClientAddressIbgeCode, data);
  }
}
