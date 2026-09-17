import { Injectable } from '@nestjs/common';
import { DelayedError, Job, UnrecoverableError } from 'bullmq';
import { AppException } from 'src/core/filters/app.exception';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { PermanentProviderError } from 'src/shared/errors/permanent-provider.error';
import { RetryScheduledError } from 'src/shared/errors/retry-scheduled.error';
import { TransientProviderError } from 'src/shared/errors/transient-provider.error';
import type { ConfirmNfseBankPaymentJobDto } from '../../../../application/queue/jobs/confirm-nfse-bank-payment-job.dto';
import type { IssueNfseBankPaymentJobDto } from '../../../../application/queue/jobs/issue-nfse-bank-payment-job.dto';
import type { IssueNfseBatchJobDto } from '../../../../application/queue/jobs/issue-nfse-batch-job.dto';
import type { PollNfseBatchJobDto } from '../../../../application/queue/jobs/poll-nfse-batch-job.dto';
import type { ReconcileNfseJobDto } from '../../../../application/queue/jobs/reconcile-nfse-job.dto';
import type { SettleNfseBankPaymentJobDto } from '../../../../application/queue/jobs/settle-nfse-bank-payment-job.dto';
import { ConfirmNfseBankPayment } from '../../../../application/usecases/confirm-nfse-bank-payment/confirm-nfse-bank-payment.service';
import { ProcessIssueNfseBankPayment } from '../../../../application/usecases/process-issue-nfse-bank-payment/process-issue-nfse-bank-payment.service';
import { ProcessIssueNfseBatch } from '../../../../application/usecases/process-issue-nfse-batch/process-issue-nfse-batch.service';
import { ProcessPollNfseBatch } from '../../../../application/usecases/process-poll-nfse-batch/process-poll-nfse-batch.service';
import { ReconcileNfse } from '../../../../application/usecases/reconcile-nfse/reconcile-nfse.service';
import { SettleNfseBankPayment } from '../../../../application/usecases/settle-nfse-bank-payment/settle-nfse-bank-payment.service';

export type NfseJobData =
  | IssueNfseBatchJobDto
  | PollNfseBatchJobDto
  | IssueNfseBankPaymentJobDto
  | ReconcileNfseJobDto
  | ConfirmNfseBankPaymentJobDto
  | SettleNfseBankPaymentJobDto;

/**
 * Roteamento e tradução de erro num lugar só.
 *
 * As filas foram separadas por tipo de job (envio, consulta, boleto) para que uma consulta lenta não
 * segure a emissão, mas o que cada job faz — e o que cada erro significa para o BullMQ — não muda com
 * a fila. Os consumers ficam sendo só a declaração de concorrência e limite; a decisão vive aqui.
 */
@Injectable()
export class NfseJobRouter {
  constructor(
    private readonly processIssueNfseBatch: ProcessIssueNfseBatch,
    private readonly processPollNfseBatch: ProcessPollNfseBatch,
    private readonly processIssueNfseBankPayment: ProcessIssueNfseBankPayment,
    private readonly reconcileNfse: ReconcileNfse,
    private readonly confirmNfseBankPayment: ConfirmNfseBankPayment,
    private readonly settleNfseBankPayment: SettleNfseBankPayment,
  ) {}

  public async run(job: Job<NfseJobData>, token?: string): Promise<void> {
    try {
      await this.dispatch(job);
    }
    catch (error: unknown) {
      // A aplicação já registrou a falha e agendou a própria retentativa, com a escada gravada no
      // banco e conduzida pela varredura. Encerrar o job aqui evita que o BullMQ retente por cima e
      // que cada rodada termine na fila de falhas, retida 30 dias e alertada a cada janela.
      if (error instanceof RetryScheduledError) {
        return;
      }

      // Erro permanente não melhora com repetição: gastar as tentativas do job só atrasa o
      // diagnóstico. `UnrecoverableError` vive aqui — o consumer é o único lugar que conhece BullMQ.
      if (error instanceof PermanentProviderError) {
        throw new UnrecoverableError(error.message);
      }

      // O provedor disse quando voltar a procurá-lo. Reagendar respeitando o `Retry-After` custa
      // zero tentativa; insistir antes da hora consome a escada de retry contra um 429 que só
      // passaria depois.
      if (error instanceof TransientProviderError && error.retryAfterSeconds && token) {
        await job.moveToDelayed(Date.now() + error.retryAfterSeconds * 1000, token);
        throw new DelayedError(error.message);
      }

      throw error;
    }
  }

  private async dispatch(job: Job<NfseJobData>): Promise<void> {
    switch (job.name) {
      case JobName.IssueNfseBatch:
        return this.processIssueNfseBatch.execute(job.data as IssueNfseBatchJobDto);
      case JobName.PollNfseBatch:
        return this.processPollNfseBatch.execute(job.data as PollNfseBatchJobDto);
      case JobName.IssueNfseBankPayment:
        await this.processIssueNfseBankPayment.execute(job.data as IssueNfseBankPaymentJobDto);
        return;
      case JobName.ReconcileNfse:
        await this.reconcileNfse.execute(job.data as ReconcileNfseJobDto);
        return;
      case JobName.ConfirmNfseBankPayment:
        await this.confirmNfseBankPayment.execute(job.data as ConfirmNfseBankPaymentJobDto);
        return;
      case JobName.SettleNfseBankPayment:
        await this.settleNfseBankPayment.execute(job.data as SettleNfseBankPaymentJobDto);
        return;
      default:
        throw new AppException(`Unknown job name: ${job.name}`);
    }
  }
}
