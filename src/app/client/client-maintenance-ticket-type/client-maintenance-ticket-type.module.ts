import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientMaintenanceTicketTypePersistenceModule } from './application/persistence/client-maintenance-ticket-type-persistence.module';
import { CreateClientMaintenanceTicketType } from './application/usecases/create-client-maintenance-ticket-type/create-client-maintenance-ticket-type.service';
import { DeleteClientMaintenanceTicketType } from './application/usecases/delete-client-maintenance-ticket-type/delete-client-maintenance-ticket-type.service';
import { EditClientMaintenanceTicketType } from './application/usecases/edit-client-maintenance-ticket-type/edit-client-maintenance-ticket-type.service';
import { FindAllClientMaintenanceTicketType } from './application/usecases/find-all-client-maintenance-ticket-type/find-all-client-maintenance-ticket-type.service';
import { FindClientMaintenanceTicketTypeById } from './application/usecases/find-client-maintenance-ticket-type-by-id/find-client-maintenance-ticket-type-by-id.service';
import { UpdateClientMaintenanceTicketTypeStatus } from './application/usecases/update-client-maintenance-ticket-type-status/update-client-maintenance-ticket-type-status.service';
import { ClientMaintenanceTicketTypeAdminController } from './infra/drivers/http/admin/client-maintenance-ticket-type-admin.controller';

@Module({
  imports: [
    ClientMaintenanceTicketTypePersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientMaintenanceTicketTypeAdminController,
  ],
  providers: [
    CreateClientMaintenanceTicketType,
    DeleteClientMaintenanceTicketType,
    EditClientMaintenanceTicketType,
    FindAllClientMaintenanceTicketType,
    FindClientMaintenanceTicketTypeById,
    UpdateClientMaintenanceTicketTypeStatus,
  ],
  exports: [
    FindClientMaintenanceTicketTypeById,
  ],
})
export class ClientMaintenanceTicketTypeModule {}
