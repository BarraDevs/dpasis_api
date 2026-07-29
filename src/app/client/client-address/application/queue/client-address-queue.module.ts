import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { CepLookupModule } from 'src/infra/cep-lookup/cep-lookup.module';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import { ClientAddressQueueBullmqAdapterProducer } from '../../infra/driven/queue/bullmq/client-address-queue-bullmq.producer';
import { ClientAddressQueueFakeAdapterProducer } from '../../infra/driven/queue/fake/client-address-queue-fake.producer';
import { ClientAddressBullmqConsumer } from '../../infra/drivers/queue/bullmq/client-address-bullmq.consumer';
import { ClientAddressPersistenceModule } from '../persistence/client-address-persistence.module';
import { ProcessResolveClientAddressIbgeCode } from '../usecases/process-resolve-client-address-ibge-code/process-resolve-client-address-ibge-code.service';

@Module({})
export class ClientAddressQueueModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: ClientAddressQueueModule,
      imports: [
        ...(isTest ? [] : [
          BullModule.registerQueue({
            name: QueueName.ClientAddress,
            defaultJobOptions: {
              attempts: 5,
              backoff: { type: 'exponential', delay: 30_000 },
              removeOnComplete: true,
              removeOnFail: false,
            },
          }),
          BullBoardModule.forFeature({
            name: QueueName.ClientAddress,
            adapter: BullMQAdapter,
          }),
        ]),
        ClientAddressPersistenceModule,
        CepLookupModule.register(),
      ],
      providers: [
        {
          provide: TOKENS.ClientAddressQueueProducer,
          useClass: isTest ? ClientAddressQueueFakeAdapterProducer : ClientAddressQueueBullmqAdapterProducer,
        },
        ...(isTest ? [] : [
          ClientAddressBullmqConsumer,
          ProcessResolveClientAddressIbgeCode,
        ]),
      ],
      exports: [
        TOKENS.ClientAddressQueueProducer,
      ],
    };
  }
}
