import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import { NfseJobData, NfseJobRouter } from './nfse-job.router';

/**
 * Emissão e confirmação de cobrança no Inter.
 *
 * O Inter aceita 120 chamadas/min em produção para `POST /cobrancas` e `GET /cobrancas`; o limiter
 * fica abaixo disso porque a mesma cota é compartilhada com as rotas administrativas de boleto.
 * Fila própria porque uma indisponibilidade do banco não pode segurar a emissão fiscal.
 */
@Processor(QueueName.NfseBankPayment, {
  concurrency: 6,
  limiter: { max: 100, duration: 60_000 },
})
@Injectable()
export class NfseBankPaymentBullmqConsumer extends WorkerHost {
  constructor(private readonly router: NfseJobRouter) {
    super();
  }

  public async process(job: Job<NfseJobData>, token?: string): Promise<void> {
    await this.router.run(job, token);
  }
}
