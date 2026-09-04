import { ExternalApiError } from './external-api.error';

/**
 * Falha de provedor que pode ter outro resultado numa próxima tentativa: timeout, conexão cortada,
 * 5xx, 429, 408, 425. Distinguir importa porque a alternativa — tratar tudo igual — gasta as cinco
 * tentativas do job num 422 que nunca vai passar, e desiste de um 429 que passaria em trinta
 * segundos.
 *
 * Herda de `ExternalApiError` de propósito: quem já tratava a classe antiga continua funcionando,
 * e a classificação é aditiva.
 */
export class TransientProviderError extends ExternalApiError {
  constructor(message: string, public readonly retryAfterSeconds?: number) {
    super(message);
    this.name = 'TransientProviderError';
  }
}
