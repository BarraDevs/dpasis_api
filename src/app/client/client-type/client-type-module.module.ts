import { Module } from '@nestjs/common';
import { ClientAttendanceTypeModule } from './client-attendance-type/client-attendance-type.module';
import { ClientDescriptionTypeModule } from './client-description-type/client-description-type.module';
import { ClientDriveTypeModule } from './client-drive-type/client-drive-type.module';
import { ClientMaintenanceTicketTypeModule } from './client-maintenance-ticket-type/client-maintenance-ticket-type.module';
import { ClientSystemTypeModule } from './client-system-type/client-system-type.module';
import { ClientTypeModule } from './client-type/client-type.module';

const modules = [
  ClientAttendanceTypeModule,
  ClientDescriptionTypeModule,
  ClientDriveTypeModule,
  ClientMaintenanceTicketTypeModule,
  ClientSystemTypeModule,
  ClientTypeModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class ClientTypeModuleModule {}
