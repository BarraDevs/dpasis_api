import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';

export class ConfirmNfseBankPaymentInputDto {
  nfseId: number;
}

export class ConfirmNfseBankPaymentOutputDto {
  nfseId: number;
  status: BankPaymentStatus;
  confirmed: boolean;
}
