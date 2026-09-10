import { ExternalApiError } from './external-api.error';

/**
 * A falha do provedor foi registrada **e** a própria aplicação já agendou a próxima tentativa.
 *
 * Existe para que a fila não retente por conta própria: a escada de retentativa vive no banco
 * (`bankPaymentNextRetryAt`) e é conduzida pela varredura. Se o job também retentasse, cada rodada
 * gastaria as tentativas do BullMQ e terminaria na fila de falhas — retida 30 dias e alertada a
 * cada janela, mesmo depois de a varredura resolver a nota.
 *
 * Herda de `ExternalApiError` (503) porque, na rota HTTP de retry manual, é isso que o operador
 * precisa ver: o provedor está indisponível e o sistema volta a tentar sozinho.
 */
export class RetryScheduledError extends ExternalApiError {
  constructor(message: string, public readonly nextAttemptAt: Date) {
    super(message);
    this.name = 'RetryScheduledError';
  }
}
