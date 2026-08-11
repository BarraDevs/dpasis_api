import { forwardRef, Module } from '@nestjs/common';
import { CompanyModule } from 'src/app/company/company/company.module';
import { AuthenticationGuardsModule } from '../../authentication/application/guards/guards.module';
import { ClientAddressModule } from '../client-address/client-address.module';
import { ClientAttendanceModule } from '../client-attendance/client-attendance.module';
import { ClientGroupModule } from '../client-group/client-group.module';
import { ClientMaintenanceTicketModule } from '../client-maintenance-ticket/client-maintenance-ticket.module';
import { ResaleModule } from 'src/app/resale/resale/resale.module';
import { HonorificModule } from 'src/app/global/honorific/honorific.module';
import { ClientPersistenceModule } from './application/persistence/client-persistence.module';
import { ActivateClient } from './application/usecases/activate-client/activate-client.service';
import { CreateClient } from './application/usecases/create-client/create-client.service';
import { DeactivateClient } from './application/usecases/deactivate-client/deactivate-client.service';
import { EditClient } from './application/usecases/edit-client/edit-client.service';
import { FindAllClient } from './application/usecases/find-all-client/find-all-client.service';
import { FindClientById } from './application/usecases/find-client-by-id/find-client-by-id.service';
import { FindSubClients } from './application/usecases/find-sub-clients/find-sub-clients.service';
import { GetClientSequence } from './application/usecases/get-client-sequence/get-client-sequence.service';
import { LinkClientAttendanceAndMaintenance } from './application/usecases/link-client-attendance-and-maintenance/link-client-attendance-and-maintenance.service';
import { SearchClient } from './application/usecases/search-client/search-client.service';
import { SetClientNextId } from './application/usecases/set-client-next-id/set-client-next-id.service';
import { SetClientParent } from './application/usecases/set-client-parent/set-client-parent.service';
import { CheckClientDocumentInUse } from './application/usecases/check-client-document-in-use/check-client-document-in-use.service';
import { LookupClientDocumentAndCnpj } from './application/usecases/lookup-client-document-and-cnpj/lookup-client-document-and-cnpj.service';
import { ClientAdminController } from './infra/drivers/http/admin/client-admin.controller';
import { CnpjLookupModule } from 'src/infra/cnpj-lookup/cnpj-lookup.module';
import { CnpjLookup } from 'src/app/external-apis/application/usecases/cnpj-lookup/cnpj-lookup.service';

@Module({
  imports: [
    forwardRef(() => ClientAddressModule),
    forwardRef(() => HonorificModule),
    ClientPersistenceModule,
    ClientGroupModule,
    ResaleModule,
    ClientAttendanceModule,
    ClientMaintenanceTicketModule,
    CompanyModule,
    AuthenticationGuardsModule,
    CnpjLookupModule.register(),
  ],
  controllers: [
    ClientAdminController,
  ],
  providers: [
    ActivateClient,
    CreateClient,
    CheckClientDocumentInUse,
    DeactivateClient,
    EditClient,
    FindAllClient,
    FindClientById,
    FindSubClients,
    SearchClient,
    SetClientParent,
    GetClientSequence,
    LinkClientAttendanceAndMaintenance,
    SetClientNextId,
    LookupClientDocumentAndCnpj,
    CnpjLookup,
  ],
  exports: [
    FindClientById,
    SearchClient,
  ],
})
export class ClientModule {}
