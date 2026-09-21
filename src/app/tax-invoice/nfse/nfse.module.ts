import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientAddressModule } from 'src/app/client/client-address/client-address.module';
import { ClientInvoiceConfigModule } from 'src/app/client/client-invoice-config/client-invoice-config.module';
import { ClientModule } from 'src/app/client/client/client.module';
import { CompanyModule } from 'src/app/company/company/company.module';
import { CompanyNfsConfigModule } from 'src/app/company/company-nfs-config/company-nfs-config.module';
import { NfsGenerationModule } from 'src/infra/nfs-generation/nfs-generation.module';
import { NfsePersistenceModule } from './application/persistence/nfse-persistence.module';
import { NfseQueueModule } from './application/queue/nfse-queue.module';
import { CancelNfse } from './application/usecases/cancel-nfse/cancel-nfse.service';
import { FindNfseById } from './application/usecases/find-nfse-by-id/find-nfse-by-id.service';
import { GetNfseMetrics } from './application/usecases/get-nfse-metrics/get-nfse-metrics.service';
import { IssueNfse } from './application/usecases/issue-nfse/issue-nfse.service';
import { ListIssuedNfseFromProvider } from './application/usecases/list-issued-nfse-from-provider/list-issued-nfse-from-provider.service';
import { NfseAdminController } from './infra/drivers/http/admin/nfse-admin.controller';
import { NfseMetricsAdminController } from './infra/drivers/http/admin/nfse-metrics-admin.controller';
import { BankPaymentModule } from 'src/infra/bank-payment/bank-payment.module';

@Module({
  imports: [
    ClientModule,
    ClientAddressModule,
    ClientInvoiceConfigModule,
    CompanyModule,
    CompanyNfsConfigModule,
    NfsePersistenceModule,
    BankPaymentModule.register(),
    NfseQueueModule.register(),
    NfsGenerationModule.register(),
    AuthenticationGuardsModule,
  ],
  controllers: [
    NfseAdminController,
    NfseMetricsAdminController,
  ],
  providers: [
    CancelNfse,
    FindNfseById,
    GetNfseMetrics,
    IssueNfse,
    ListIssuedNfseFromProvider,
  ],
  exports: [
    CancelNfse,
    FindNfseById,
    GetNfseMetrics,
    IssueNfse,
    NfsePersistenceModule,
    NfseQueueModule,
  ],
})
export class NfseModule {}
