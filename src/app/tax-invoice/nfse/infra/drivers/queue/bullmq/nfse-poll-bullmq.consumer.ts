import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import { NfseJobData, NfseJobRouter } from './nfse-job.router';

/**
 * Consulta de lote e reconciliação por RPS — as duas são leitura e idempotentes por natureza.
 *
 * É o volume do fluxo: 300 notas de um fechamento, cada uma com a escada de poll, davam ~3.000
 * consultas em série na fila única. Concorrência 6 tira isso do caminho da emissão.
 */
@Processor(QueueName.NfsePoll, {
  concurrency: 6,
  limiter: { max: 120, duration: 60_000 },
})
@Injectable()
export class NfsePollBullmqConsumer extends WorkerHost {
  constructor(private readonly router: NfseJobRouter) {
    super();
  }

  public async process(job: Job<NfseJobData>, token?: string): Promise<void> {
    await this.router.run(job, token);
  }
}
