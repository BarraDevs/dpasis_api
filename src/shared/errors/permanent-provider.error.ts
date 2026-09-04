import { AppException } from 'src/core/filters/app.exception';

/**
 * Falha de provedor que vai se repetir igual em qualquer tentativa: payload inválido, credencial
 * recusada, permissão ausente. Repetir é desperdício e atrasa o diagnóstico — o job deve ir direto
 * para a fila de falhas com o motivo preservado.
 */
export class PermanentProviderError extends AppException {
  constructor(message: string) {
    super(message, 400);
    this.name = 'PermanentProviderError';
  }
}
