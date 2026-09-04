import { AppException } from 'src/core/filters/app.exception';

/**
 * A consulta ao provedor não respondeu se a nota existe — devolveu um erro sobre a própria consulta.
 * Reemitir sem essa resposta é apostar contra uma nota que pode existir, então a rota recusa e o
 * operador resolve o motivo primeiro.
 */
export class NfseProviderQueryInconclusiveError extends AppException {
  constructor(message: string) {
    super(`Consulta ao provedor não foi conclusiva: ${message}`, 409);
    this.name = 'NfseProviderQueryInconclusiveError';
  }
}
