import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { NfmModule } from 'src/app/tax-invoice/nfm/nfm.module';
import { NfseModule } from 'src/app/tax-invoice/nfse/nfse.module';
import { IssueBankPaymentByNfmId } from './application/usecases/issue-bank-payment-by-nfm-id/issue-bank-payment-by-nfm-id.service';
import { ReissueBankPaymentByNfmId } from './application/usecases/reissue-bank-payment-by-nfm-id/reissue-bank-payment-by-nfm-id.service';
import { BankPaymentCoreModule } from './bank-payment-core.module';
import { BankPaymentAdminController } from './infra/drivers/http/admin/bank-payment-admin.controller';

@Module({
  imports: [
    BankPaymentCoreModule,
    AuthenticationGuardsModule,
    NfmModule,
    NfseModule,
  ],
  controllers: [
    BankPaymentAdminController,
  ],
  providers: [
    IssueBankPaymentByNfmId,
    ReissueBankPaymentByNfmId,
  ],
  exports: [
    BankPaymentCoreModule,
    IssueBankPaymentByNfmId,
  ],
})
export class BankPaymentModule {}
