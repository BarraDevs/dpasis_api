import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientAttendanceTypePersistenceModule } from './application/persistence/client-attendance-type-persistence.module';
import { CreateClientAttendanceType } from './application/usecases/create-client-attendance-type/create-client-attendance-type.service';
import { DeleteClientAttendanceType } from './application/usecases/delete-client-attendance-type/delete-client-attendance-type.service';
import { EditClientAttendanceType } from './application/usecases/edit-client-attendance-type/edit-client-attendance-type.service';
import { FindAllClientAttendanceType } from './application/usecases/find-all-client-attendance-type/find-all-client-attendance-type.service';
import { FindClientAttendanceTypeById } from './application/usecases/find-client-attendance-type-by-id/find-client-attendance-type-by-id.service';
import { UpdateClientAttendanceTypeStatus } from './application/usecases/update-client-attendance-type-status/update-client-attendance-type-status.service';
import { ClientAttendanceTypeAdminController } from './infra/drivers/http/admin/client-attendance-type-admin.controller';

@Module({
  imports: [
    ClientAttendanceTypePersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientAttendanceTypeAdminController,
  ],
  providers: [
    CreateClientAttendanceType,
    DeleteClientAttendanceType,
    EditClientAttendanceType,
    FindAllClientAttendanceType,
    FindClientAttendanceTypeById,
    UpdateClientAttendanceTypeStatus,
  ],
  exports: [
    FindClientAttendanceTypeById,
  ],
})
export class ClientAttendanceTypeModule {}
