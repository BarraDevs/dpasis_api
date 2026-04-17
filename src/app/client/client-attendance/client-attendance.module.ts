import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientAttendancePersistenceModule } from './application/persistence/client-attendance-persistence.module';
import { CreateClientAttendance } from './application/usecases/create-client-attendance/create-client-attendance.service';
import { DeleteClientAttendance } from './application/usecases/delete-client-attendance/delete-client-attendance.service';
import { EditClientAttendance } from './application/usecases/edit-client-attendance/edit-client-attendance.service';
import { FindAllClientAttendance } from './application/usecases/find-all-client-attendance/find-all-client-attendance.service';
import { FindClientAttendanceById } from './application/usecases/find-client-attendance-by-id/find-client-attendance-by-id.service';
import { UpdateClientAttendanceStatus } from './application/usecases/update-client-attendance-status/update-client-attendance-status.service';
import { ClientAttendanceAdminController } from './infra/drivers/http/admin/client-attendance-admin.controller';

@Module({
  imports: [
    ClientAttendancePersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientAttendanceAdminController,
  ],
  providers: [
    CreateClientAttendance,
    DeleteClientAttendance,
    EditClientAttendance,
    FindAllClientAttendance,
    FindClientAttendanceById,
    UpdateClientAttendanceStatus,
  ],
  exports: [
    FindClientAttendanceById,
  ],
})
export class ClientAttendanceModule {}
