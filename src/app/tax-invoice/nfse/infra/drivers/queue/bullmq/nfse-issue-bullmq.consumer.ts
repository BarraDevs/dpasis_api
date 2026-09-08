import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import { NfseJobData, NfseJobRouter } from './nfse-job.router';

/**
 * Envio de RPS ao provedor de NFS-e.
 *
 * Concorrência baixa de propósito: o Giss não publica limite de requisições, então ele é o recurso
 * escasso do fluxo — e emissão é a chamada cara (TLS, PFX, XML assinado). O `limiter` é
 * conservador pelo mesmo motivo; sobe quando houver número confirmado da prefeitura.
 */
@Processor(QueueName.NfseIssue, {
  concurrency: 2,
  limiter: { max: 30, duration: 60_000 },
})
@Injectable()
export class NfseIssueBullmqConsumer extends WorkerHost {
  constructor(private readonly router: NfseJobRouter) {
    super();
  }

  public async process(job: Job<NfseJobData>, token?: string): Promise<void> {
    await this.router.run(job, token);
  }
}
