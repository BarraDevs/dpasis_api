import { Nfse } from 'src/app/tax-invoice/nfse/domain/entities/nfse.entity';

export type ReserveNfseInput = {
  companyId: number;
  clientId: number;
  rpsSeries: string;
  data: Record<string, unknown>;
  nfmId: number | null;
  jobName: string;
};

export type ReserveNfseOutput = {
  nfseId: number;
  rpsNumber: number;
  outboxId: number;
};

export interface INfseRepository {
  /**
   * Reserva o número de RPS, cria a NFS-e `PENDING`, grava o vínculo com a NFM nos dois sentidos e
   * registra a intenção de despacho no outbox — tudo numa transação só. É o que fecha a janela em
   * que a NFS-e existia e a NFM ainda não sabia disso.
   */
  reserve(input: ReserveNfseInput): Promise<ReserveNfseOutput>;
  markOutboxDispatched(outboxId: number): Promise<void>;
  save(entity: Nfse): Promise<number>;
  edit(entity: Nfse): Promise<void>;
  /**
   * Marca em bloco que a operação já foi avisada das ressalvas do fisco. Em bloco porque o alerta é
   * um digest: carregar e regravar 200 notas uma a uma para gravar um timestamp seria absurdo.
   */
  markProviderAlertsNotified(ids: number[], notifiedAt: Date): Promise<void>;
  findById(id: number): Promise<Nfse | null>;
}
