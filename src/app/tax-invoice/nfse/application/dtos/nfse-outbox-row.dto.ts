/**
 * Linha do outbox pendente de despacho. `payload` é o corpo do job exatamente como foi gravado na
 * transação de criação da NFS-e — o sweeper reenfileira o que está lá, não recalcula nada.
 */
export class NfseOutboxRowDto {
  id: number;
  nfseId: number;
  jobName: string;
  payload: Record<string, unknown>;
}
