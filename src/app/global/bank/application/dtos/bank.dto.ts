import { BankCertFormat } from '../../domain/enums/bank-cert-format.enum';

export class BankDto {
  id: number;
  drawer: string;
  wallet: string;
  account: string;
  agency: string;
  bankCode: string;
  bankName: string;
  paymentLocation: string | null;
  fineRate: number | null;
  moraRate: number | null;
  apiUrl: string | null;
  clientIdHint: string | null;
  hasClientSecret: boolean;
  hasCertificate: boolean;
  certFormat: BankCertFormat | null;
  certificateNotAfter: Date | null;
  hasWebhookToken: boolean;
  integrationConfigured: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
