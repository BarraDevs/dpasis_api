export class SettleNfseBankPaymentInputDto {
  nfseId?: number;
  requestCode?: string;
}

export class SettleNfseBankPaymentOutputDto {
  nfseId: number;
  status: string | null;
  settled: boolean;
}
