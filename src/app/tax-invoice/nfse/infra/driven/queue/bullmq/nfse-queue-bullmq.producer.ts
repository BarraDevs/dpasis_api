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

/**
 * Três filas, uma por tipo de trabalho: envio, consulta e boleto.
 *
 * Na fila única, uma consulta pendurada segurava a emissão do dia seguinte e uma indisponibilidade
 * do banco segurava a emissão fiscal — tudo com concorrência 1. A separação também deixa cada fila
 * ter concorrência e limite próprios, que é o que os provedores pedem: o Giss é o recurso escasso,
 * o Inter aguenta 120 chamadas/min.
 */
@Injectable()
export class NfseQueueBullmqAdapterProducer implements INfseQueueProducer {
  constructor(
    @InjectQueue(QueueName.NfseIssue) private readonly issueQueue: Queue,
    @InjectQueue(QueueName.NfsePoll) private readonly pollQueue: Queue,
    @InjectQueue(QueueName.NfseBankPayment) private readonly bankPaymentQueue: Queue,
  ) {}

  public async addIssueBatchJob(data: IssueNfseBatchJobDto): Promise<void> {
    await this.issueQueue.add(JobName.IssueNfseBatch, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 30_000 },
    });
  }

  public async addPollBatchJob(data: PollNfseBatchJobDto, options?: NfseQueueJobOptions): Promise<void> {
    await this.pollQueue.add(JobName.PollNfseBatch, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 30_000 },
      delay: options?.delayMs,
    });
  }

  public async addIssueBankPaymentJob(data: IssueNfseBankPaymentJobDto): Promise<void> {
    await this.bankPaymentQueue.add(JobName.IssueNfseBankPayment, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  /**
   * Consulta idempotente por natureza: repetir não cria nada do outro lado. Poucas tentativas e
   * espaçamento largo bastam — quem insiste de verdade é a varredura, que reagenda a nota inteira.
   */
  public async addReconcileNfseJob(data: ReconcileNfseJobDto): Promise<void> {
    await this.pollQueue.add(JobName.ReconcileNfse, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 60_000 },
    });
  }

  public async addConfirmBankPaymentJob(data: ConfirmNfseBankPaymentJobDto): Promise<void> {
    await this.bankPaymentQueue.add(JobName.ConfirmNfseBankPayment, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 60_000 },
    });
  }
}
