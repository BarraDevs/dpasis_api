import { Module } from '@nestjs/common';
import { CompanyModule } from 'src/app/company/company/company.module';
import { CompanyNfsConfigModule } from 'src/app/company/company-nfs-config/company-nfs-config.module';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceConfigModule } from 'src/app/client/client-invoice-config/client-invoice-config.module';
import { ClientItemModule } from 'src/app/client/client-item/client-item.module';
import { NfsGenerationModule } from 'src/infra/nfs-generation/nfs-generation.module';
import { NfmPersistenceModule } from './application/persistence/nfm-persistence.module';
import { FindAllNfms } from './application/usecases/find-all-nfms/find-all-nfms.service';
import { FindElegibleClients } from './application/usecases/find-elegible-clients/find-elegible-clients.service';
import { SaveElegibleNfms } from './application/usecases/save-elegible-nfms/save-elegible-nfms.service';
import { NfmAdminController } from './infra/drivers/http/admin/nfm-admin.controller';

@Module({
  imports: [
    ClientModule,
    ClientInvoiceConfigModule,
    ClientItemModule,
    CompanyModule,
    CompanyNfsConfigModule,
    NfmPersistenceModule,
    NfsGenerationModule.register(),
  ],
  controllers: [
    NfmAdminController,
  ],
  providers: [
    FindAllNfms,
    FindElegibleClients,
    SaveElegibleNfms,
  ],
  exports: [
    FindAllNfms,
    FindElegibleClients,
    SaveElegibleNfms,
  ],
})
export class NfmModule {}
