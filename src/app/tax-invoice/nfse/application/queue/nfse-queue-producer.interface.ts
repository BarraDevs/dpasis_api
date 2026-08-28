import type { IssueNfseBankPaymentJobDto } from './jobs/issue-nfse-bank-payment-job.dto';
import type { IssueNfseBatchJobDto } from './jobs/issue-nfse-batch-job.dto';
import type { PollNfseBatchJobDto } from './jobs/poll-nfse-batch-job.dto';

export type NfseQueueJobOptions = {
  delayMs?: number;
};

export interface INfseQueueProducer {
  addIssueBatchJob(data: IssueNfseBatchJobDto): Promise<void>;
  addPollBatchJob(data: PollNfseBatchJobDto, options?: NfseQueueJobOptions): Promise<void>;
  addIssueBankPaymentJob(data: IssueNfseBankPaymentJobDto): Promise<void>;
}
