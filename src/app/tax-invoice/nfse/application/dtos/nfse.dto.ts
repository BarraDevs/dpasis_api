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
  bankPaymentProvider: string | null;
  bankPaymentRequestCode: string | null;
  bankPaymentIdempotencyKey: string | null;
  bankPaymentRequestedAt: Date | null;
  bankPaymentErrorMessage: string | null;
  bankPaymentFailedAt: Date | null;
  nfmId: number | null;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
