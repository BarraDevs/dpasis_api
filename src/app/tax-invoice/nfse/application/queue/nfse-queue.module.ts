import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import { BankPaymentCoreModule } from 'src/app/bank-payment/bank-payment-core.module';
import { ClientInvoiceConfigModule } from 'src/app/client/client-invoice-config/client-invoice-config.module';
import { CompanyNfsConfigModule } from 'src/app/company/company-nfs-config/company-nfs-config.module';
import { CompanyModule } from 'src/app/company/company/company.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { NfsGenerationModule } from 'src/infra/nfs-generation/nfs-generation.module';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import { NfseQueueBullmqAdapterProducer } from '../../infra/driven/queue/bullmq/nfse-queue-bullmq.producer';
import { NfseQueueFakeAdapterProducer } from '../../infra/driven/queue/fake/nfse-queue-fake.producer';
import { NfseBullmqConsumer } from '../../infra/drivers/queue/bullmq/nfse-bullmq.consumer';
import { NfsePersistenceModule } from '../persistence/nfse-persistence.module';
import { ProcessIssueNfseBankPayment } from '../usecases/process-issue-nfse-bank-payment/process-issue-nfse-bank-payment.service';
import { ProcessIssueNfseBatch } from '../usecases/process-issue-nfse-batch/process-issue-nfse-batch.service';
import { ProcessPollNfseBatch } from '../usecases/process-poll-nfse-batch/process-poll-nfse-batch.service';
import { ConfirmNfseBankPayment } from '../usecases/confirm-nfse-bank-payment/confirm-nfse-bank-payment.service';
import { ReconcileNfsePeriod } from '../usecases/reconcile-nfse-period/reconcile-nfse-period.service';
import { ReconcileNfse } from '../usecases/reconcile-nfse/reconcile-nfse.service';

const THIRTY_DAYS_IN_SECONDS = 2_592_000;

@Module({})
export class NfseQueueModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: NfseQueueModule,
      imports: [
        ...(isTest ? [] : [
          BullModule.registerQueue({
            name: QueueName.Nfse,
            defaultJobOptions: {
              removeOnComplete: true,
              removeOnFail: { age: THIRTY_DAYS_IN_SECONDS },
            },
          }),
          BullBoardModule.forFeature({
            name: QueueName.Nfse,
            adapter: BullMQAdapter,
          }),
        ]),
        CompanyNfsConfigModule,
        CompanyModule,
        NfsePersistenceModule,
        NfsGenerationModule.register(),
        BankPaymentCoreModule,
        ClientInvoiceConfigModule,
      ],
      providers: [
        ProcessIssueNfseBatch,
        ProcessPollNfseBatch,
        ProcessIssueNfseBankPayment,
        ReconcileNfse,
        ReconcileNfsePeriod,
        ConfirmNfseBankPayment,
        {
          provide: TOKENS.NfseQueueProducer,
          useClass: isTest ? NfseQueueFakeAdapterProducer : NfseQueueBullmqAdapterProducer,
        },
        ...(isTest ? [] : [NfseBullmqConsumer]),
      ],
      exports: [
        TOKENS.NfseQueueProducer,
        ProcessIssueNfseBankPayment,
        ReconcileNfse,
        ReconcileNfsePeriod,
        ConfirmNfseBankPayment,
      ],
    };
  }
}
