import { forwardRef, Module } from '@nestjs/common';
import { CompanyModule } from 'src/app/company/company.module';
import { AuthenticationGuardsModule } from '../../authentication/application/guards/guards.module';
import { ClientAddressModule } from '../client-address/client-address.module';
import { ClientAttendanceModule } from '../client-attendance/client-attendance.module';
import { ClientGroupModule } from '../client-group/client-group.module';
import { ClientMaintenanceTicketModule } from '../client-maintenance-ticket/client-maintenance-ticket.module';
import { ClientOwnerModule } from '../client-owner/client-owner.module';
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
import { SetClientNextId } from './application/usecases/set-client-next-id/set-client-next-id.service';
import { ClientAdminController } from './infra/drivers/http/admin/client-admin.controller';

@Module({
  imports: [
    forwardRef(() => ClientAddressModule),
    ClientPersistenceModule,
    ClientGroupModule,
    ClientOwnerModule,
    ClientAttendanceModule,
    ClientMaintenanceTicketModule,
    CompanyModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientAdminController,
  ],
  providers: [
    ActivateClient,
    CreateClient,
    DeactivateClient,
    EditClient,
    FindAllClient,
    FindClientById,
    FindSubClients,
    GetClientSequence,
    LinkClientAttendanceAndMaintenance,
    SetClientNextId,
  ],
  exports: [
    FindClientById,
  ],
})
export class ClientModule {}
