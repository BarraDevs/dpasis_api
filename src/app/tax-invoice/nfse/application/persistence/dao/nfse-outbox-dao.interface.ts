import { NfseOutboxRowDto } from '../../dtos/nfse-outbox-row.dto';

export interface INfseOutboxDao {
  /**
   * Linhas gravadas na transação e nunca despachadas. O limiar de idade evita competir com o
   * despacho normal, que acontece milissegundos depois do commit.
   */
  findUndispatched(olderThanSeconds: number, limit: number): Promise<NfseOutboxRowDto[]>;
}
