import { Module } from '@nestjs/common';
import { BankPaymentModule as BankPaymentModuleInfra } from 'src/infra/bank-payment/bank-payment.module';
import { CancelBankPayment } from './application/usecases/cancel-bank-payment/cancel-bank-payment.service';
import { FindAllBankPayment } from './application/usecases/find-all-bank-payment/find-all-bank-payment.service';
import { FindBankPayment } from './application/usecases/find-bank-payment/find-bank-payment.service';
import { GetBankPaymentPdf } from './application/usecases/get-bank-payment-pdf/get-bank-payment-pdf.service';
import { IssueBankPayment } from './application/usecases/issue-bank-payment/issue-bank-payment.service';

/**
 * Gateway-backed bank-payment use cases without NFM/NFS-e deps.
 * Kept separate so NfseQueueModule can import IssueBankPayment without a circular graph.
 */
@Module({
  imports: [
    BankPaymentModuleInfra.register(),
  ],
  providers: [
    IssueBankPayment,
    FindAllBankPayment,
    FindBankPayment,
    GetBankPaymentPdf,
    CancelBankPayment,
  ],
  exports: [
    IssueBankPayment,
    FindAllBankPayment,
    FindBankPayment,
    GetBankPaymentPdf,
    CancelBankPayment,
  ],
})
export class BankPaymentCoreModule {}
