import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { BankModule } from 'src/app/global/bank/bank.module';
import { NfmModule } from 'src/app/tax-invoice/nfm/nfm.module';
import { NfseModule } from 'src/app/tax-invoice/nfse/nfse.module';
import { IssueBankPaymentByNfmId } from './application/usecases/issue-bank-payment-by-nfm-id/issue-bank-payment-by-nfm-id.service';
import { ReissueBankPaymentByNfmId } from './application/usecases/reissue-bank-payment-by-nfm-id/reissue-bank-payment-by-nfm-id.service';
import { BankPaymentCoreModule } from './bank-payment-core.module';
import { BankPaymentAdminController } from './infra/drivers/http/admin/bank-payment-admin.controller';
import { InterCobrancaWebhookController } from './infra/drivers/http/webhook/inter-cobranca-webhook.controller';
import { ReceiveInterCobrancaWebhook } from './application/usecases/receive-inter-cobranca-webhook/receive-inter-cobranca-webhook.service';

@Module({
  imports: [
    BankPaymentCoreModule,
    AuthenticationGuardsModule,
    NfmModule,
    NfseModule,
    BankModule,
  ],
  controllers: [
    BankPaymentAdminController,
    InterCobrancaWebhookController,
  ],
  providers: [
    IssueBankPaymentByNfmId,
    ReissueBankPaymentByNfmId,
    ReceiveInterCobrancaWebhook,
  ],
  exports: [
    BankPaymentCoreModule,
    IssueBankPaymentByNfmId,
    ReceiveInterCobrancaWebhook,
  ],
})
export class BankPaymentModule {}
