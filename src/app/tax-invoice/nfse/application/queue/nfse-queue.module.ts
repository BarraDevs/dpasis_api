import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { NfsGenerationModule } from 'src/infra/nfs-generation/nfs-generation.module';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import { NfseQueueBullmqAdapterProducer } from '../../infra/driven/queue/bullmq/nfse-queue-bullmq.producer';
import { NfseQueueFakeAdapterProducer } from '../../infra/driven/queue/fake/nfse-queue-fake.producer';
import { NfseBullmqConsumer } from '../../infra/drivers/queue/bullmq/nfse-bullmq.consumer';
import { NfsePersistenceModule } from '../persistence/nfse-persistence.module';
import { ProcessIssueNfseBatch } from '../usecases/process-issue-nfse-batch/process-issue-nfse-batch.service';
import { ProcessPollNfseBatch } from '../usecases/process-poll-nfse-batch/process-poll-nfse-batch.service';

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
              removeOnFail: true,
            },
          }),
          BullBoardModule.forFeature({
            name: QueueName.Nfse,
            adapter: BullMQAdapter,
          }),
        ]),
        NfsePersistenceModule,
        NfsGenerationModule.register(),
      ],
      providers: [
        {
          provide: TOKENS.NfseQueueProducer,
          useClass: isTest ? NfseQueueFakeAdapterProducer : NfseQueueBullmqAdapterProducer,
        },
        ...(isTest ? [] : [
          NfseBullmqConsumer,
          ProcessIssueNfseBatch,
          ProcessPollNfseBatch,
        ]),
      ],
      exports: [
        TOKENS.NfseQueueProducer,
      ],
    };
  }
}
