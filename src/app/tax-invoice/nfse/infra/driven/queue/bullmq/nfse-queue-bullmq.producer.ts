import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import type { ConfirmNfseBankPaymentJobDto } from '../../../../application/queue/jobs/confirm-nfse-bank-payment-job.dto';
import type { IssueNfseBankPaymentJobDto } from '../../../../application/queue/jobs/issue-nfse-bank-payment-job.dto';
import type { IssueNfseBatchJobDto } from '../../../../application/queue/jobs/issue-nfse-batch-job.dto';
import type { PollNfseBatchJobDto } from '../../../../application/queue/jobs/poll-nfse-batch-job.dto';
import type { ReconcileNfseJobDto } from '../../../../application/queue/jobs/reconcile-nfse-job.dto';
import type { INfseQueueProducer, NfseQueueJobOptions } from '../../../../application/queue/nfse-queue-producer.interface';

@Injectable()
export class NfseQueueBullmqAdapterProducer implements INfseQueueProducer {
  constructor(
    @InjectQueue(QueueName.Nfse) private readonly queue: Queue,
  ) {}

  public async addIssueBatchJob(data: IssueNfseBatchJobDto): Promise<void> {
    await this.queue.add(JobName.IssueNfseBatch, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 30_000 },
    });
  }

  public async addPollBatchJob(data: PollNfseBatchJobDto, options?: NfseQueueJobOptions): Promise<void> {
    await this.queue.add(JobName.PollNfseBatch, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 30_000 },
      delay: options?.delayMs,
    });
  }

  public async addIssueBankPaymentJob(data: IssueNfseBankPaymentJobDto): Promise<void> {
    await this.queue.add(JobName.IssueNfseBankPayment, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  /**
   * Consulta idempotente por natureza: repetir não cria nada do outro lado. Poucas tentativas e
   * espaçamento largo bastam — quem insiste de verdade é a varredura, que reagenda a nota inteira.
   */
  public async addReconcileNfseJob(data: ReconcileNfseJobDto): Promise<void> {
    await this.queue.add(JobName.ReconcileNfse, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 60_000 },
    });
  }

  public async addConfirmBankPaymentJob(data: ConfirmNfseBankPaymentJobDto): Promise<void> {
    await this.queue.add(JobName.ConfirmNfseBankPayment, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 60_000 },
    });
  }
}
