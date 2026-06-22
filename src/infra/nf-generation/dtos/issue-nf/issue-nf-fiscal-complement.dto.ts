import { NfEnvironment } from '../../enums/nf-environment.enum';

export class IssueNfFiscalComplementDto {
  environment: NfEnvironment;
  series: number;
  nfeNumber?: number;
  naturezaOperacao: string;
  operationType: number;
  finalidade: number;
  presenceIndicator: number;
  intermediaryIndicator: number;
  paymentMethod: string;
  paymentValue: number;
  freightMode: number;
  additionalInfo?: string | null;
  orderReference?: string | null;
}
