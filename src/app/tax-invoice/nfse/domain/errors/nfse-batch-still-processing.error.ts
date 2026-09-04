import { AppException } from 'src/core/filters/app.exception';

/**
 * O lote foi aceito pelo provedor (há protocolo) e ele ainda não conhece o RPS: o processamento
 * está em andamento. Reenviar agora é apostar contra o lote em voo — a consulta do lote, já
 * reagendada, é quem resolve.
 */
export class NfseBatchStillProcessingError extends AppException {
  constructor(batchProtocol: string) {
    super(`Lote ${batchProtocol} ainda em processamento no provedor; consulta reagendada.`, 409);
    this.name = 'NfseBatchStillProcessingError';
  }
}
