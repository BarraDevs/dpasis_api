export class SettleNfseBankPaymentInputDto {
  nfseId?: number;
  requestCode?: string;
  bankId?: number;
}

export class SettleNfseBankPaymentOutputDto {
  nfseId: number;
  status: string | null;
  settled: boolean;
}
