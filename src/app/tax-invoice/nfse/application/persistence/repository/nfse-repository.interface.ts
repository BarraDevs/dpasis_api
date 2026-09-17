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
  /**
   * Reivindica a nota para a próxima rodada de retentativa do boleto: só passa se a retentativa
   * estiver vencida e a nota continuar sem cobrança vinculada. Grava o lease em
   * `bankPaymentNextRetryAt`, conta a rodada e devolve `false` para quem perdeu a corrida.
   */
  claimBankPaymentRetry(nfseId: number, now: Date, leaseUntil: Date): Promise<boolean>;
  /**
   * Reivindica a nota para a consulta de liquidação: só passa se a cobrança continua confirmada,
   * em aberto, e com a consulta vencida. Empurra o lease para a frente para duas réplicas não
   * enfileirarem a mesma GET no Inter.
   */
  claimBankPaymentSettlement(nfseId: number, now: Date, leaseUntil: Date): Promise<boolean>;
  findById(id: number): Promise<Nfse | null>;
  findByBankPaymentRequestCode(requestCode: string): Promise<Nfse | null>;
}
