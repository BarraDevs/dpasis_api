import { AppException } from 'src/core/filters/app.exception';

/**
 * Levantado quando o índice único parcial `nfses_one_active_per_nfm` recusa a criação de uma
 * segunda NFS-e viva para a mesma NFM. Não é falha: é a guarda de banco fazendo o trabalho que
 * antes dependia de o processo não morrer entre dois commits. Quem chama deve contar como
 * "pulado", não como erro.
 */
export class NfmAlreadyHasActiveNfseError extends AppException {
  constructor(nfmId: number) {
    super(`NFM ${nfmId} já possui uma NFS-e ativa.`, 409);
    this.name = 'NfmAlreadyHasActiveNfseError';
  }
}
