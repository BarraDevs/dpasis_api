import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientAddressModule } from '../../client-address/client-address.module';
import { ClientModule } from '../../client/client.module';
import { ClientAttendanceTypeModule } from '../client-attendance-type/client-attendance-type.module';
import { ClientDescriptionTypeModule } from '../client-description-type/client-description-type.module';
import { ClientDriveTypeModule } from '../client-drive-type/client-drive-type.module';
import { ClientMaintenanceTicketTypeModule } from '../client-maintenance-ticket-type/client-maintenance-ticket-type.module';
import { ClientSystemTypeModule } from '../client-system-type/client-system-type.module';
import { ClientTypePersistenceModule } from './application/persistence/client-type-persistence.module';
import { CreateClientType } from './application/usecases/create-client-type/create-client-type.service';
import { DeleteBulkClientType } from './application/usecases/delete-bulk-client-type/delete-bulk-client-type.service';
import { DeleteClientType } from './application/usecases/delete-client-type/delete-client-type.service';
import { EditClientType } from './application/usecases/edit-client-type/edit-client-type.service';
import { FindAllClientType } from './application/usecases/find-all-client-type/find-all-client-type.service';
import { FindClientTypeById } from './application/usecases/find-client-type-by-id/find-client-type-by-id.service';
import { UpdateClientTypeStatus } from './application/usecases/update-client-type-status/update-client-type-status.service';
import { ClientTypeAdminController } from './infra/drivers/http/admin/client-type-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    ClientTypePersistenceModule,
    ClientModule,
    ClientAddressModule,
    ClientAttendanceTypeModule,
    ClientMaintenanceTicketTypeModule,
    ClientSystemTypeModule,
    ClientDescriptionTypeModule,
    ClientDriveTypeModule,
  ],
  controllers: [
    ClientTypeAdminController,
  ],
  providers: [
    CreateClientType,
    DeleteBulkClientType,
    DeleteClientType,
    EditClientType,
    FindAllClientType,
    FindClientTypeById,
    UpdateClientTypeStatus,
  ],
})
export class ClientTypeModule {}
