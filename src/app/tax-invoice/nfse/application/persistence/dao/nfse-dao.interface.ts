import { NfseAlertRowDto, NfseDailyClosingDto } from '../../dtos/nfse-alert-row.dto';
import { NfseDto } from '../../dtos/nfse.dto';

export interface INfseDao {
  findById(id: number): Promise<NfseDto | null>;
  /** Não terminais (PENDING/SUBMITTED/PROCESSING) sem movimento há mais que o limiar. */
  findStuck(olderThanMinutes: number): Promise<NfseAlertRowDto[]>;
  /** Notas paradas esperando o provedor — hoje só a Onda 3 as resolve. */
  findAwaitingProvider(): Promise<NfseAlertRowDto[]>;
  /** Emitidas sem cobrança vinculada há mais que o limiar. */
  findIssuedWithoutBankPayment(olderThanMinutes: number): Promise<NfseAlertRowDto[]>;
  /** Fechamento de um dia: quantas foram emitidas e quantas têm boleto. */
  countIssuedByDay(dayStart: Date, dayEnd: Date): Promise<NfseDailyClosingDto>;
}
