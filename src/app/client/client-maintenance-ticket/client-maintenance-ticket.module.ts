import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientMaintenanceTicketPersistenceModule } from './application/persistence/client-maintenance-ticket-persistence.module';
import { CreateClientMaintenanceTicket } from './application/usecases/create-client-maintenance-ticket/create-client-maintenance-ticket.service';
import { DeleteClientMaintenanceTicket } from './application/usecases/delete-client-maintenance-ticket/delete-client-maintenance-ticket.service';
import { EditClientMaintenanceTicket } from './application/usecases/edit-client-maintenance-ticket/edit-client-maintenance-ticket.service';
import { FindAllClientMaintenanceTicket } from './application/usecases/find-all-client-maintenance-ticket/find-all-client-maintenance-ticket.service';
import { FindClientMaintenanceTicketById } from './application/usecases/find-client-maintenance-ticket-by-id/find-client-maintenance-ticket-by-id.service';
import { UpdateClientMaintenanceTicketStatus } from './application/usecases/update-client-maintenance-ticket-status/update-client-maintenance-ticket-status.service';
import { ClientMaintenanceTicketAdminController } from './infra/drivers/http/admin/client-maintenance-ticket-admin.controller';

@Module({
  imports: [
    ClientMaintenanceTicketPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientMaintenanceTicketAdminController,
  ],
  providers: [
    CreateClientMaintenanceTicket,
    DeleteClientMaintenanceTicket,
    EditClientMaintenanceTicket,
    FindAllClientMaintenanceTicket,
    FindClientMaintenanceTicketById,
    UpdateClientMaintenanceTicketStatus,
  ],
  exports: [
    FindClientMaintenanceTicketById,
  ],
})
export class ClientMaintenanceTicketModule {}
