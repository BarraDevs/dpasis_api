import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { AppException } from 'src/core/filters/app.exception';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import { ResolveClientAddressIbgeCodeJobDto } from '../../../../application/queue/jobs/resolve-client-address-ibge-code-job.dto';
import { ProcessResolveClientAddressIbgeCode } from '../../../../application/usecases/process-resolve-client-address-ibge-code/process-resolve-client-address-ibge-code.service';

@Processor(QueueName.ClientAddress)
@Injectable()
export class ClientAddressBullmqConsumer extends WorkerHost {
  constructor(
    private readonly processResolveClientAddressIbgeCode: ProcessResolveClientAddressIbgeCode,
  ) {
    super();
  }

  public async process(job: Job<ResolveClientAddressIbgeCodeJobDto>): Promise<void> {
    switch (job.name) {
      case JobName.ResolveClientAddressIbgeCode:
        await this.processResolveClientAddressIbgeCode.execute(job.data);
        return;
      default:
        throw new AppException(`Unknown job name: ${job.name}`);
    }
  }
}
