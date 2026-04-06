import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import { UploadFileModule as UploadFileInfraModule } from 'src/infra/upload-file/upload-file.module';
import { UploadFileQueueBullmqAdapterProducer } from '../../infra/driven/queue/bullmq/upload-file-queue-bullmq.producer';
import { UploadFileQueueFakeAdapterProducer } from '../../infra/driven/queue/fake/upload-file-queue-fake.producer';
import { UploadFileBullmqConsumer } from '../../infra/drivers/queue/bullmq/upload-file-bullmq.consumer';

@Module({})
export class UploadFileQueueModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: UploadFileQueueModule,
      imports: [
        ...(isTest ? [] : [
          BullModule.registerQueue({
            name: QueueName.UploadFile,
            defaultJobOptions: {
              removeOnComplete: true,
              removeOnFail: true,
            },
          }),
        ]),
        UploadFileInfraModule.register(),
      ],
      providers: [
        {
          provide: TOKENS.UploadFileQueueProducer,
          useClass: isTest ? UploadFileQueueFakeAdapterProducer : UploadFileQueueBullmqAdapterProducer,
        },
        ...(isTest ? [] : [UploadFileBullmqConsumer]),
      ],
      exports: [
        TOKENS.UploadFileQueueProducer,
      ],
    };
  }
}
