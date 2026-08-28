import { Module } from '@nestjs/common';
import { ClientModule } from 'src/app/client/client/client.module';
import { BankModule } from 'src/app/global/bank/bank.module';
import { AuthenticationGuardsModule } from '../../authentication/application/guards/guards.module';
import { ClientAddressModule } from '../client-address/client-address.module';
import { ClientInvoiceConfigPersistenceModule } from './application/persistence/client-invoice-config-persistence.module';
import { CreateClientInvoiceConfig } from './application/usecases/create-client-invoice-config/create-client-invoice-config.service';
import { DeleteClientInvoiceConfig } from './application/usecases/delete-client-invoice-config/delete-client-invoice-config.service';
import { EditClientInvoiceConfig } from './application/usecases/edit-client-invoice-config/edit-client-invoice-config.service';
import { FindAllClientInvoiceConfig } from './application/usecases/find-all-client-invoice-config/find-all-client-invoice-config.service';
import { FindClientInvoiceConfigByClientId } from './application/usecases/find-client-invoice-config-by-client-id/find-client-invoice-config-by-client-id.service';
import { ClientInvoiceConfigAdminController } from './infra/drivers/http/client-invoice-config-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    ClientInvoiceConfigPersistenceModule,
    ClientAddressModule,
    ClientModule,
    BankModule,
  ],
  controllers: [
    ClientInvoiceConfigAdminController,
  ],
  providers: [
    CreateClientInvoiceConfig,
    EditClientInvoiceConfig,
    FindAllClientInvoiceConfig,
    FindClientInvoiceConfigByClientId,
    DeleteClientInvoiceConfig,
  ],
  exports: [
    FindAllClientInvoiceConfig,
    FindClientInvoiceConfigByClientId,
  ],
})
export class ClientInvoiceConfigModule {}
