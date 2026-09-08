import { Module } from '@nestjs/common';
import { Environment } from 'src/core/config/environment.enum';
import { AlertModule } from 'src/infra/alert/alert.module';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { BankPaymentCoreModule } from 'src/app/bank-payment/bank-payment-core.module';
import { CompanyModule } from 'src/app/company/company/company.module';
import { CompanyNfsConfigModule } from 'src/app/company/company-nfs-config/company-nfs-config.module';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceConfigModule } from 'src/app/client/client-invoice-config/client-invoice-config.module';
import { ClientItemModule } from 'src/app/client/client-item/client-item.module';
import { NfsGenerationModule } from 'src/infra/nfs-generation/nfs-generation.module';
import { NfseModule } from 'src/app/tax-invoice/nfse/nfse.module';
import { NfmPersistenceModule } from './application/persistence/nfm-persistence.module';
import { CancelNfm } from './application/usecases/cancel-nfm/cancel-nfm.service';
import { FindElegibleClients } from './application/usecases/find-elegible-clients/find-elegible-clients.service';
import { FindGeneratedNfms } from './application/usecases/find-generated-nfms/find-generated-nfms.service';
import { FindNfmById } from './application/usecases/find-nfm-by-id/find-nfm-by-id.service';
import { FindNfmProviderStatus } from './application/usecases/find-nfm-provider-status/find-nfm-provider-status.service';
import { ReconcileNfm } from './application/usecases/reconcile-nfm/reconcile-nfm.service';
import { ReissueNfm } from './application/usecases/reissue-nfm/reissue-nfm.service';
import { RunDailyNfmIssuance } from './application/usecases/run-daily-nfm-issuance/run-daily-nfm-issuance.service';
import { SaveElegibleNfms } from './application/usecases/save-elegible-nfms/save-elegible-nfms.service';
import { NfmAdminController } from './infra/drivers/http/admin/nfm-admin.controller';
import { NfmIssuanceScheduler } from './infra/drivers/schedule/nfm-issuance.scheduler';

const isTest = process.env.NODE_ENV === Environment.Test;

@Module({
  imports: [
    BankPaymentCoreModule,
    ClientModule,
    ClientInvoiceConfigModule,
    ClientItemModule,
    CompanyModule,
    CompanyNfsConfigModule,
    NfseModule,
    NfsGenerationModule.register(),
    NfmPersistenceModule,
    AuthenticationGuardsModule,
    AlertModule.register(),
  ],
  controllers: [
    NfmAdminController,
  ],
  providers: [
    FindElegibleClients,
    FindGeneratedNfms,
    FindNfmById,
    SaveElegibleNfms,
    CancelNfm,
    FindNfmProviderStatus,
    ReconcileNfm,
    ReissueNfm,
    RunDailyNfmIssuance,
    // O agendador fica de fora em teste: `@Cron` dispararia durante a suíte.
    ...(isTest ? [] : [NfmIssuanceScheduler]),
  ],
  exports: [
    FindElegibleClients,
    FindGeneratedNfms,
    FindNfmById,
    SaveElegibleNfms,
    CancelNfm,
    FindNfmProviderStatus,
    ReconcileNfm,
    ReissueNfm,
    RunDailyNfmIssuance,
  ],
})
export class NfmModule {}
