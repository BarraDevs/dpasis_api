import { Module } from '@nestjs/common';
import { ClientAddressModule } from 'src/app/client/client-address/client-address.module';
import { ClientModule } from 'src/app/client/client/client.module';
import { CompanyModule } from 'src/app/company/company.module';
import { NfsePersistenceModule } from './application/persistence/nfse-persistence.module';
import { NfseQueueModule } from './application/queue/nfse-queue.module';
import { FindNfseById } from './application/usecases/find-nfse-by-id/find-nfse-by-id.service';
import { IssueNfse } from './application/usecases/issue-nfse/issue-nfse.service';
import { NfseAdminController } from './infra/drivers/http/admin/nfse-admin.controller';

@Module({
  imports: [
    ClientModule,
    ClientAddressModule,
    CompanyModule,
    NfsePersistenceModule,
    NfseQueueModule.register(),
  ],
  controllers: [
    NfseAdminController,
  ],
  providers: [
    IssueNfse,
    FindNfseById,
  ],
  exports: [
    IssueNfse,
    FindNfseById,
  ],
})
export class NfseModule {}
