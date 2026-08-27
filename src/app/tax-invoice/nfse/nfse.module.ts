import { Module } from '@nestjs/common';
import { ClientAddressModule } from 'src/app/client/client-address/client-address.module';
import { ClientModule } from 'src/app/client/client/client.module';
import { CompanyModule } from 'src/app/company/company/company.module';
import { CompanyNfsConfigModule } from 'src/app/company/company-nfs-config/company-nfs-config.module';
import { NfsGenerationModule } from 'src/infra/nfs-generation/nfs-generation.module';
import { NfsePersistenceModule } from './application/persistence/nfse-persistence.module';
import { NfseQueueModule } from './application/queue/nfse-queue.module';
import { CancelNfse } from './application/usecases/cancel-nfse/cancel-nfse.service';
import { FindNfseById } from './application/usecases/find-nfse-by-id/find-nfse-by-id.service';
import { IssueNfse } from './application/usecases/issue-nfse/issue-nfse.service';

@Module({
  imports: [
    ClientModule,
    ClientAddressModule,
    CompanyModule,
    CompanyNfsConfigModule,
    NfsePersistenceModule,
    NfseQueueModule.register(),
    NfsGenerationModule.register(),
  ],
  providers: [
    IssueNfse,
    FindNfseById,
    CancelNfse,
  ],
  exports: [
    IssueNfse,
    FindNfseById,
    CancelNfse,
  ],
})
export class NfseModule {}
