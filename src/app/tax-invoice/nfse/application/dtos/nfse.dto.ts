import { NfseStatus } from '../../domain/enums/nfse-status.enum';

export class NfseDto {
  id: number;
  companyId: number;
  clientId: number;
  rpsNumber: number;
  rpsSeries: string;
  status: NfseStatus;
  batchProtocol: string | null;
  nfseNumber: string | null;
  verificationCode: string | null;
  issuedAt: Date | null;
  errorMessage: string | null;
  canceledAt: Date | null;
  cancelReasonCode: number | null;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
