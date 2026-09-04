import { AppException } from 'src/core/filters/app.exception';
import { NfseStatus } from '../enums/nfse-status.enum';

/**
 * Reemissão só é autorizada a partir de `REJECTED` (fisco recusou o conteúdo) ou
 * `AWAITING_PROVIDER` (ainda não se sabe — e só depois de a própria rota consultar). `FAILED` é
 * falha de configuração: o conserto é `POST /reconcile` se o provedor tiver a nota, não reenviar.
 * `ISSUED` e `CANCELED` estão fora: reemitir ali é o único erro irreversível deste fluxo.
 */
export class NfseNotReissuableError extends AppException {
  constructor(status: NfseStatus) {
    super(`NFS-e em ${status} não pode ser reemitida.`, 409);
    this.name = 'NfseNotReissuableError';
  }
}
