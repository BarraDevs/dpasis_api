import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { AppException } from 'src/core/filters/app.exception';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import { PermanentProviderError } from 'src/shared/errors/permanent-provider.error';
import { ConfirmNfseBankPaymentJobDto } from '../../../../application/queue/jobs/confirm-nfse-bank-payment-job.dto';
import { IssueNfseBankPaymentJobDto } from '../../../../application/queue/jobs/issue-nfse-bank-payment-job.dto';
import { IssueNfseBatchJobDto } from '../../../../application/queue/jobs/issue-nfse-batch-job.dto';
import { PollNfseBatchJobDto } from '../../../../application/queue/jobs/poll-nfse-batch-job.dto';
import { ReconcileNfseJobDto } from '../../../../application/queue/jobs/reconcile-nfse-job.dto';
import { ConfirmNfseBankPayment } from '../../../../application/usecases/confirm-nfse-bank-payment/confirm-nfse-bank-payment.service';
import { ProcessIssueNfseBankPayment } from '../../../../application/usecases/process-issue-nfse-bank-payment/process-issue-nfse-bank-payment.service';
import { ProcessIssueNfseBatch } from '../../../../application/usecases/process-issue-nfse-batch/process-issue-nfse-batch.service';
import { ProcessPollNfseBatch } from '../../../../application/usecases/process-poll-nfse-batch/process-poll-nfse-batch.service';
import { ReconcileNfse } from '../../../../application/usecases/reconcile-nfse/reconcile-nfse.service';

@Processor(QueueName.Nfse)
@Injectable()
export class NfseBullmqConsumer extends WorkerHost {
  constructor(
    private readonly processIssueNfseBatch: ProcessIssueNfseBatch,
    private readonly processPollNfseBatch: ProcessPollNfseBatch,
    private readonly processIssueNfseBankPayment: ProcessIssueNfseBankPayment,
    private readonly reconcileNfse: ReconcileNfse,
    private readonly confirmNfseBankPayment: ConfirmNfseBankPayment,
  ) {
    super();
  }

  public async process(
    job: Job<
      IssueNfseBatchJobDto | PollNfseBatchJobDto | IssueNfseBankPaymentJobDto
      | ReconcileNfseJobDto | ConfirmNfseBankPaymentJobDto
    >,
  ): Promise<void> {
    try {
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
        case JobName.ReconcileNfse:
          await this.reconcileNfse.execute(job.data as ReconcileNfseJobDto);
          return;
        case JobName.ConfirmNfseBankPayment:
          await this.confirmNfseBankPayment.execute(job.data as ConfirmNfseBankPaymentJobDto);
          return;
        default:
          throw new AppException(`Unknown job name: ${job.name}`);
      }
    }
    catch (error: unknown) {
      // Erro permanente não melhora com repetição: gastar as tentativas do job só atrasa o
      // diagnóstico. `UnrecoverableError` vive aqui — o consumer é o único lugar que conhece BullMQ.
      if (error instanceof PermanentProviderError) {
        throw new UnrecoverableError(error.message);
      }
      throw error;
    }
  }
}
