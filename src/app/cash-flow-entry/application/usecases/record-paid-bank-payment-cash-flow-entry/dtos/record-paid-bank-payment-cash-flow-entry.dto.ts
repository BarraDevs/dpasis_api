export class RecordPaidBankPaymentCashFlowEntryInputDto {
  companyId: number;
  nfseId: number;
  bankPaymentRequestCode: string;
  occurredAt: Date;
  amount?: number;
}

export class RecordPaidBankPaymentCashFlowEntryOutputDto {
  id: number | null;
}
