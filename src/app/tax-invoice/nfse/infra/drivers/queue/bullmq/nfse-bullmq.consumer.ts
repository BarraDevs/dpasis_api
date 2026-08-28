import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { AppException } from 'src/core/filters/app.exception';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import { IssueNfseBankPaymentJobDto } from '../../../../application/queue/jobs/issue-nfse-bank-payment-job.dto';
import { IssueNfseBatchJobDto } from '../../../../application/queue/jobs/issue-nfse-batch-job.dto';
import { PollNfseBatchJobDto } from '../../../../application/queue/jobs/poll-nfse-batch-job.dto';
import { ProcessIssueNfseBankPayment } from '../../../../application/usecases/process-issue-nfse-bank-payment/process-issue-nfse-bank-payment.service';
import { ProcessIssueNfseBatch } from '../../../../application/usecases/process-issue-nfse-batch/process-issue-nfse-batch.service';
import { ProcessPollNfseBatch } from '../../../../application/usecases/process-poll-nfse-batch/process-poll-nfse-batch.service';

@Processor(QueueName.Nfse)
@Injectable()
export class NfseBullmqConsumer extends WorkerHost {
  constructor(
    private readonly processIssueNfseBatch: ProcessIssueNfseBatch,
    private readonly processPollNfseBatch: ProcessPollNfseBatch,
    private readonly processIssueNfseBankPayment: ProcessIssueNfseBankPayment,
  ) {
    super();
  }

  public async process(
    job: Job<IssueNfseBatchJobDto | PollNfseBatchJobDto | IssueNfseBankPaymentJobDto>,
  ): Promise<void> {
    switch (job.name) {
      case JobName.IssueNfseBatch:
        await this.processIssueNfseBatch.execute(job.data as IssueNfseBatchJobDto);
        return;
      case JobName.PollNfseBatch:
        await this.processPollNfseBatch.execute(job.data as PollNfseBatchJobDto);
        return;
      case JobName.IssueNfseBankPayment:
        await this.processIssueNfseBankPayment.execute(job.data as IssueNfseBankPaymentJobDto);
        return;
      default:
        throw new AppException(`Unknown job name: ${job.name}`);
    }
  }
}
