import { NfseStatus } from '../../domain/enums/nfse-status.enum';

/**
 * Projeção enxuta para as varreduras de alerta. O `NfseDto` completo carrega o snapshot em `data`
 * (Json), que não serve para varrer dezenas de notas nem para montar um corpo de e-mail.
 */
export class NfseAlertRowDto {
  id: number;
  status: NfseStatus;
  nfseNumber: string | null;
  errorMessage: string | null;
  issuedAt: Date | null;
  updatedAt: Date;
}

export class NfseDailyClosingDto {
  issued: number;
  withBankPayment: number;
}
