import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientDepartmentPersistenceModule } from './application/persistence/client-department-persistence.module';
import { CreateClientDepartment } from './application/usecases/create-client-department/create-client-department.service';
import { DeleteClientDepartment } from './application/usecases/delete-client-department/delete-client-department.service';
import { EditClientDepartment } from './application/usecases/edit-client-department/edit-client-department.service';
import { FindAllClientDepartment } from './application/usecases/find-all-client-department/find-all-client-department.service';
import { FindClientDepartmentById } from './application/usecases/find-client-department-by-id/find-client-department-by-id.service';
import { UpdateClientDepartmentStatus } from './application/usecases/update-client-department-status/update-client-department-status.service';
import { ClientDepartmentAdminController } from './infra/drivers/http/admin/client-department-admin.controller';

@Module({
  imports: [
    ClientDepartmentPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientDepartmentAdminController,
  ],
  providers: [
    CreateClientDepartment,
    DeleteClientDepartment,
    EditClientDepartment,
    FindAllClientDepartment,
    FindClientDepartmentById,
    UpdateClientDepartmentStatus,
  ],
  exports: [
    FindClientDepartmentById,
  ],
})
export class ClientDepartmentModule {}
