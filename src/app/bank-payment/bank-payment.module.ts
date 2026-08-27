import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { BankPaymentModule as BankPaymentModuleInfra } from 'src/infra/bank-payment/bank-payment.module';
import { CancelBankPayment } from './application/usecases/cancel-bank-payment/cancel-bank-payment.service';
import { FindBankPayment } from './application/usecases/find-bank-payment/find-bank-payment.service';
import { GetBankPaymentPdf } from './application/usecases/get-bank-payment-pdf/get-bank-payment-pdf.service';
import { IssueBankPayment } from './application/usecases/issue-bank-payment/issue-bank-payment.service';
import { BankPaymentAdminController } from './infra/drivers/http/admin/bank-payment-admin.controller';

@Module({
  imports: [
    BankPaymentModuleInfra.register(),
    AuthenticationGuardsModule,
  ],
  controllers: [
    BankPaymentAdminController,
  ],
  providers: [
    IssueBankPayment,
    FindBankPayment,
    GetBankPaymentPdf,
    CancelBankPayment,
  ],
  exports: [
    IssueBankPayment,
    FindBankPayment,
    GetBankPaymentPdf,
    CancelBankPayment,
  ],
})
export class BankPaymentModule {}
