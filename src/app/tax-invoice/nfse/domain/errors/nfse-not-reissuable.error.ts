import { AppException } from 'src/core/filters/app.exception';
import { NfseStatus } from '../enums/nfse-status.enum';

/**
 * Reemissão é autorizada a partir de `REJECTED` (fisco recusou o conteúdo), `AWAITING_PROVIDER`
 * (ainda não se sabe) e `FAILED` (falha de configuração) — sempre depois de a própria rota consultar
 * o provedor. Os três são estados de onde a nota precisa poder voltar depois de o operador corrigir
 * alguma coisa; o que muda entre eles é o que se corrige, não se há saída.
 *
 * `ISSUED` e `CANCELED` estão fora: reemitir ali é o único erro irreversível deste fluxo. Os estados
 * em andamento (`PENDING`, `SUBMITTED`, `PROCESSING`) também, porque a emissão ainda está de pé.
 */
export class NfseNotReissuableError extends AppException {
  constructor(status: NfseStatus) {
    super(`NFS-e em ${status} não pode ser reemitida.`, 409);
    this.name = 'NfseNotReissuableError';
  }
}
