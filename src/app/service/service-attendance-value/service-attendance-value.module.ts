import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceCatalogModule } from 'src/app/service/service-catalog/service-catalog.module';
import { ServiceAttendanceValuePersistenceModule } from './application/persistence/service-attendance-value-persistence.module';
import { CreateServiceAttendanceValue } from './application/usecases/create-service-attendance-value/create-service-attendance-value.service';
import { DeleteServiceAttendanceValue } from './application/usecases/delete-service-attendance-value/delete-service-attendance-value.service';
import { EditServiceAttendanceValue } from './application/usecases/edit-service-attendance-value/edit-service-attendance-value.service';
import { FindAllServiceAttendanceValue } from './application/usecases/find-all-service-attendance-value/find-all-service-attendance-value.service';
import { FindServiceAttendanceValueById } from './application/usecases/find-service-attendance-value-by-id/find-service-attendance-value-by-id.service';
import { ServiceAttendanceValueAdminController } from './infra/drivers/http/admin/service-attendance-value-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    ServiceAttendanceValuePersistenceModule,
    ServiceCatalogModule,
  ],
  controllers: [
    ServiceAttendanceValueAdminController,
  ],
  providers: [
    CreateServiceAttendanceValue,
    DeleteServiceAttendanceValue,
    EditServiceAttendanceValue,
    FindAllServiceAttendanceValue,
    FindServiceAttendanceValueById,
  ],
  exports: [
    FindServiceAttendanceValueById,
  ],
})
export class ServiceAttendanceValueModule {}
