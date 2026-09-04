import { AppException } from 'src/core/filters/app.exception';

/**
 * A consulta feita no momento da reemissão encontrou a nota no provedor. O estado local foi
 * corrigido para `ISSUED` e **nada** foi reenviado: reenviar aqui produziria uma segunda NFS-e para
 * o mesmo serviço.
 */
export class NfseAlreadyIssuedAtProviderError extends AppException {
  constructor(nfseNumber: string) {
    super(`NFS-e já emitida no provedor sob o número ${nfseNumber}; estado local reconciliado.`, 409);
    this.name = 'NfseAlreadyIssuedAtProviderError';
  }
}
