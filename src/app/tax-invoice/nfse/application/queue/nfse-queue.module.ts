import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import { AuditModule } from 'src/app/audit/audit.module';
import { BankPaymentCoreModule } from 'src/app/bank-payment/bank-payment-core.module';
import { CashFlowEntryModule } from 'src/app/cash-flow-entry/cash-flow-entry.module';
import { ClientInvoiceConfigModule } from 'src/app/client/client-invoice-config/client-invoice-config.module';
import { CompanyNfsConfigModule } from 'src/app/company/company-nfs-config/company-nfs-config.module';
import { CompanyModule } from 'src/app/company/company/company.module';
import { TOKENS } from 'src/core/di/token';
import { NfsGenerationModule } from 'src/infra/nfs-generation/nfs-generation.module';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import { isQueueEnabled } from 'src/infra/queue/queue-environment';
import { NfseQueueBullmqAdapterMonitor } from '../../infra/driven/queue/bullmq/nfse-queue-bullmq.monitor';
import { NfseQueueBullmqAdapterProducer } from '../../infra/driven/queue/bullmq/nfse-queue-bullmq.producer';
import { NfseQueueFakeAdapterMonitor } from '../../infra/driven/queue/fake/nfse-queue-fake.monitor';
import { NfseQueueFakeAdapterProducer } from '../../infra/driven/queue/fake/nfse-queue-fake.producer';
import { NfseBankPaymentBullmqConsumer } from '../../infra/drivers/queue/bullmq/nfse-bank-payment-bullmq.consumer';
import { NfseIssueBullmqConsumer } from '../../infra/drivers/queue/bullmq/nfse-issue-bullmq.consumer';
import { NfseJobRouter } from '../../infra/drivers/queue/bullmq/nfse-job.router';
import { NfsePollBullmqConsumer } from '../../infra/drivers/queue/bullmq/nfse-poll-bullmq.consumer';
import { NfsePersistenceModule } from '../persistence/nfse-persistence.module';
import { ProcessIssueNfseBankPayment } from '../usecases/process-issue-nfse-bank-payment/process-issue-nfse-bank-payment.service';
import { ProcessIssueNfseBatch } from '../usecases/process-issue-nfse-batch/process-issue-nfse-batch.service';
import { ProcessPollNfseBatch } from '../usecases/process-poll-nfse-batch/process-poll-nfse-batch.service';
import { ConfirmNfseBankPayment } from '../usecases/confirm-nfse-bank-payment/confirm-nfse-bank-payment.service';
import { SettleNfseBankPayment } from '../usecases/settle-nfse-bank-payment/settle-nfse-bank-payment.service';
import { ReconcileNfsePeriod } from '../usecases/reconcile-nfse-period/reconcile-nfse-period.service';
import { ReconcileNfse } from '../usecases/reconcile-nfse/reconcile-nfse.service';
import { ReissueNfseBankPayment } from '../usecases/reissue-nfse-bank-payment/reissue-nfse-bank-payment.service';

const THIRTY_DAYS_IN_SECONDS = 2_592_000;

/**
 * Uma fila por tipo de trabalho, todas com a mesma retenção: o job que falhou fica 30 dias no Redis,
 * porque foi ele que apagou o rastro na Onda 1.
 */
const NFSE_QUEUE_NAMES = [
  QueueName.NfseIssue,
  QueueName.NfsePoll,
  QueueName.NfseBankPayment,
] as const;

@Module({})
export class NfseQueueModule {
  static register(): DynamicModule {
    const queueEnabled = isQueueEnabled();

    return {
      module: NfseQueueModule,
      imports: [
        ...(queueEnabled
          ? NFSE_QUEUE_NAMES.flatMap((name) => [
            BullModule.registerQueue({
              name,
              defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: { age: THIRTY_DAYS_IN_SECONDS },
              },
            }),
            BullBoardModule.forFeature({ name, adapter: BullMQAdapter }),
          ])
          : []),
        CompanyNfsConfigModule,
        CompanyModule,
        NfsePersistenceModule,
        NfsGenerationModule.register(),
        BankPaymentCoreModule,
        CashFlowEntryModule,
        ClientInvoiceConfigModule,
        AuditModule,
      ],
      providers: [
        ProcessIssueNfseBatch,
        ProcessPollNfseBatch,
        ProcessIssueNfseBankPayment,
        ReconcileNfse,
        ReconcileNfsePeriod,
        ConfirmNfseBankPayment,
        SettleNfseBankPayment,
        ReissueNfseBankPayment,
        {
          provide: TOKENS.NfseQueueProducer,
          useClass: queueEnabled ? NfseQueueBullmqAdapterProducer : NfseQueueFakeAdapterProducer,
        },
        {
          provide: TOKENS.NfseQueueMonitor,
          useClass: queueEnabled ? NfseQueueBullmqAdapterMonitor : NfseQueueFakeAdapterMonitor,
        },
        ...(queueEnabled
          ? [
            NfseJobRouter,
            NfseIssueBullmqConsumer,
            NfsePollBullmqConsumer,
            NfseBankPaymentBullmqConsumer,
          ]
          : []),
      ],
      exports: [
        TOKENS.NfseQueueProducer,
        TOKENS.NfseQueueMonitor,
        ProcessIssueNfseBankPayment,
        ReconcileNfse,
        ReconcileNfsePeriod,
        ConfirmNfseBankPayment,
        SettleNfseBankPayment,
        ReissueNfseBankPayment,
      ],
    };
  }
}
