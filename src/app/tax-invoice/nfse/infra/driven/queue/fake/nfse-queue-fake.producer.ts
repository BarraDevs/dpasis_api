import { Injectable } from '@nestjs/common';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import type { ConfirmNfseBankPaymentJobDto } from '../../../../application/queue/jobs/confirm-nfse-bank-payment-job.dto';
import type { IssueNfseBankPaymentJobDto } from '../../../../application/queue/jobs/issue-nfse-bank-payment-job.dto';
import type { IssueNfseBatchJobDto } from '../../../../application/queue/jobs/issue-nfse-batch-job.dto';
import type { PollNfseBatchJobDto } from '../../../../application/queue/jobs/poll-nfse-batch-job.dto';
import type { ReconcileNfseJobDto } from '../../../../application/queue/jobs/reconcile-nfse-job.dto';
import type { INfseQueueProducer, NfseQueueJobOptions } from '../../../../application/queue/nfse-queue-producer.interface';

@Injectable()
export class NfseQueueFakeAdapterProducer implements INfseQueueProducer {
  public readonly addedIssueBatchJobs: Array<{ name: JobName; data: IssueNfseBatchJobDto }> = [];
  public readonly addedPollBatchJobs: Array<{ name: JobName; data: PollNfseBatchJobDto; options?: NfseQueueJobOptions }> = [];
  public readonly addedIssueBankPaymentJobs: Array<{ name: JobName; data: IssueNfseBankPaymentJobDto }> = [];
  public readonly addedReconcileNfseJobs: Array<{ name: JobName; data: ReconcileNfseJobDto }> = [];
  public readonly addedConfirmBankPaymentJobs: Array<{ name: JobName; data: ConfirmNfseBankPaymentJobDto }> = [];

  public async addIssueBatchJob(data: IssueNfseBatchJobDto): Promise<void> {
    this.addedIssueBatchJobs.push({ name: JobName.IssueNfseBatch, data });
  }

  public async addPollBatchJob(data: PollNfseBatchJobDto, options?: NfseQueueJobOptions): Promise<void> {
    this.addedPollBatchJobs.push({ name: JobName.PollNfseBatch, data, options });
  }

  public async addIssueBankPaymentJob(data: IssueNfseBankPaymentJobDto): Promise<void> {
    this.addedIssueBankPaymentJobs.push({ name: JobName.IssueNfseBankPayment, data });
  }

  public async addReconcileNfseJob(data: ReconcileNfseJobDto): Promise<void> {
    this.addedReconcileNfseJobs.push({ name: JobName.ReconcileNfse, data });
  }

  public async addConfirmBankPaymentJob(data: ConfirmNfseBankPaymentJobDto): Promise<void> {
    this.addedConfirmBankPaymentJobs.push({ name: JobName.ConfirmNfseBankPayment, data });
  }
}
