import { AppException } from 'src/core/filters/app.exception';

/**
 * Reemitir o boleto só faz sentido quando o provedor confirma que a cobrança vinculada falhou
 * (`FALHA_EMISSAO`). Em qualquer outra situação ela existe — ou pode existir — do outro lado, e
 * desfazer o vínculo para emitir de novo é o caminho para o segundo boleto.
 */
export class NfseBankPaymentNotReissuableError extends AppException {
  constructor(requestCode: string, status: string) {
    super(
      `Cobrança ${requestCode} está ${status} no provedor; só cobrança com falha de emissão pode ser reemitida.`,
      409,
    );
    this.name = 'NfseBankPaymentNotReissuableError';
  }
}
