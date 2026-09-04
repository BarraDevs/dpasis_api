import { NfseStatus } from '../../../../domain/enums/nfse-status.enum';

export enum ReconcileNfseSource {
  /** O provedor devolveu a nota: a chave natural do RPS já existe do lado dele. */
  ProviderIssued = 'PROVIDER_ISSUED',
  /** O provedor afirma que não existe NFS-e para este RPS: reenviar o mesmo RPS é seguro. */
  ProviderNotFoundRequeued = 'PROVIDER_NOT_FOUND_REQUEUED',
  /** O provedor não conhece o RPS mas o lote pode estar em voo: a consulta do lote decide. */
  ProviderNotFoundPolling = 'PROVIDER_NOT_FOUND_POLLING',
  /** A consulta em si falhou. Não é resposta sobre a nota — nada de terminal sai daqui. */
  ProviderQueryFailed = 'PROVIDER_QUERY_FAILED',
  /**
   * O provedor não conhece o RPS e a nota local já está recusada (`REJECTED`/`FAILED`).
   * Não inventa `AWAITING_PROVIDER`: o lote morto não está em voo. Reenvio é a rota de reissue.
   */
  ProviderNotFound = 'PROVIDER_NOT_FOUND',
  /** Nada a fazer: a nota já estava resolvida. */
  NoOp = 'NO_OP',
}

export class ReconcileNfseInputDto {
  nfseId: number;
}

export class ReconcileNfseOutputDto {
  nfseId: number;
  previousStatus: NfseStatus;
  newStatus: NfseStatus;
  source: ReconcileNfseSource;
  nfseNumber?: string;
  message?: string;
}
