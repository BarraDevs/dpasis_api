import { Module } from '@nestjs/common';
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
import { IssueNfse } from './application/usecases/issue-nfse/issue-nfse.service';
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
  ],
  providers: [
    CancelNfse,
    FindNfseById,
    IssueNfse,
  ],
  exports: [
    CancelNfse,
    FindNfseById,
    IssueNfse,
    NfsePersistenceModule,
    NfseQueueModule,
  ],
})
export class NfseModule {}
