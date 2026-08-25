import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CompanyModule } from 'src/app/company/company/company.module';
import { CompanyNfsConfigModule } from 'src/app/company/company-nfs-config/company-nfs-config.module';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientInvoiceConfigModule } from 'src/app/client/client-invoice-config/client-invoice-config.module';
import { ClientItemModule } from 'src/app/client/client-item/client-item.module';
import { NfseModule } from 'src/app/tax-invoice/nfse/nfse.module';
import { NfmPersistenceModule } from './application/persistence/nfm-persistence.module';
import { CancelNfm } from './application/usecases/cancel-nfm/cancel-nfm.service';
import { FindElegibleClients } from './application/usecases/find-elegible-clients/find-elegible-clients.service';
import { FindGeneratedNfms } from './application/usecases/find-generated-nfms/find-generated-nfms.service';
import { FindNfmById } from './application/usecases/find-nfm-by-id/find-nfm-by-id.service';
import { SaveElegibleNfms } from './application/usecases/save-elegible-nfms/save-elegible-nfms.service';
import { NfmAdminController } from './infra/drivers/http/admin/nfm-admin.controller';

@Module({
  imports: [
    ClientModule,
    ClientInvoiceConfigModule,
    ClientItemModule,
    CompanyModule,
    CompanyNfsConfigModule,
    NfseModule,
    NfmPersistenceModule,
    AuthenticationGuardsModule,
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
  ],
  exports: [
    FindElegibleClients,
    FindGeneratedNfms,
    FindNfmById,
    SaveElegibleNfms,
    CancelNfm,
  ],
})
export class NfmModule {}
