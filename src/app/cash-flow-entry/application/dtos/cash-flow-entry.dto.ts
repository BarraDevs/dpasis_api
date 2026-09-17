export class CashFlowEntryDto {
  id: number;
  companyId: number;
  type: string;
  origin: string;
  amountInCents: number;
  occurredAt: Date;
  description: string;
  nfseId: number | null;
  bankPaymentRequestCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}
