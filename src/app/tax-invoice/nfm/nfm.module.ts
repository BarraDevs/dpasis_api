import { Module } from '@nestjs/common';
import { NfmPersistenceModule } from './application/persistence/nfm-persistence.module';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceConfigModule } from 'src/app/client/client-invoice-config/client-invoice-config.module';
import { ClientItemModule } from 'src/app/client/client-item/client-item.module';
import { FindElegibleClients } from './application/usecases/find-elegible-clients/find-elegible-clients.service';
import { NfmAdminController } from './infra/drivers/http/admin/nfm-admin.controller';

@Module({
  imports: [
    ClientModule,
    ClientInvoiceConfigModule,
    ClientItemModule,
    NfmPersistenceModule,
  ],
  controllers: [
    NfmAdminController,
  ],
  providers: [
    FindElegibleClients,
    // CreateNfm,
    // DeleteNfm,
    // EditNfm,
    // FindAllNfm,
    // FindNfmById,
  ],
  exports: [
    FindElegibleClients,
  ],
})
export class NfmModule {}
