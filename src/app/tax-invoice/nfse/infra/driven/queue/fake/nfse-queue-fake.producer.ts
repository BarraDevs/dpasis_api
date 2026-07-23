import { Injectable } from '@nestjs/common';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import type { IssueNfseBatchJobDto } from '../../../../application/queue/jobs/issue-nfse-batch-job.dto';
import type { PollNfseBatchJobDto } from '../../../../application/queue/jobs/poll-nfse-batch-job.dto';
import type { INfseQueueProducer, NfseQueueJobOptions } from '../../../../application/queue/nfse-queue-producer.interface';

@Injectable()
export class NfseQueueFakeAdapterProducer implements INfseQueueProducer {
  public readonly addedIssueBatchJobs: Array<{ name: JobName; data: IssueNfseBatchJobDto }> = [];
  public readonly addedPollBatchJobs: Array<{ name: JobName; data: PollNfseBatchJobDto; options?: NfseQueueJobOptions }> = [];

  public async addIssueBatchJob(data: IssueNfseBatchJobDto): Promise<void> {
    this.addedIssueBatchJobs.push({ name: JobName.IssueNfseBatch, data });
  }

  public async addPollBatchJob(data: PollNfseBatchJobDto, options?: NfseQueueJobOptions): Promise<void> {
    this.addedPollBatchJobs.push({ name: JobName.PollNfseBatch, data, options });
  }
}
