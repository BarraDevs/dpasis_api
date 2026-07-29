import { Injectable } from '@nestjs/common';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import type { ResolveClientAddressIbgeCodeJobDto } from '../../../../application/queue/jobs/resolve-client-address-ibge-code-job.dto';
import type { IClientAddressQueueProducer } from '../../../../application/queue/client-address-queue-producer.interface';

@Injectable()
export class ClientAddressQueueFakeAdapterProducer implements IClientAddressQueueProducer {
  public readonly addedResolveIbgeCodeJobs: Array<{ name: JobName; data: ResolveClientAddressIbgeCodeJobDto }> = [];

  public async addResolveIbgeCodeJob(data: ResolveClientAddressIbgeCodeJobDto): Promise<void> {
    this.addedResolveIbgeCodeJobs.push({ name: JobName.ResolveClientAddressIbgeCode, data });
  }
}
