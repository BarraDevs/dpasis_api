import { Module } from '@nestjs/common';
import { BankModule } from 'src/app/global/bank/bank.module';
import { BankPaymentModule as BankPaymentModuleInfra } from 'src/infra/bank-payment/bank-payment.module';
import { CancelBankPayment } from './application/usecases/cancel-bank-payment/cancel-bank-payment.service';
import { FindAllBankPayment } from './application/usecases/find-all-bank-payment/find-all-bank-payment.service';
import { FindBankPaymentByYourNumber } from './application/usecases/find-bank-payment-by-your-number/find-bank-payment-by-your-number.service';
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
    BankModule,
  ],
  providers: [
    IssueBankPayment,
    FindAllBankPayment,
    FindBankPayment,
    FindBankPaymentByYourNumber,
    GetBankPaymentPdf,
    CancelBankPayment,
  ],
  exports: [
    IssueBankPayment,
    FindAllBankPayment,
    FindBankPayment,
    FindBankPaymentByYourNumber,
    GetBankPaymentPdf,
    CancelBankPayment,
  ],
})
export class BankPaymentCoreModule {}
