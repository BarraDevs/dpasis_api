import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { DepartmentPersistenceModule } from './application/persistence/department-persistence.module';
import { CreateDepartment } from './application/usecases/create-department/create-department.service';
import { DeleteDepartment } from './application/usecases/delete-department/delete-department.service';
import { EditDepartment } from './application/usecases/edit-department/edit-department.service';
import { FindAllDepartment } from './application/usecases/find-all-department/find-all-department.service';
import { FindDepartmentById } from './application/usecases/find-department-by-id/find-department-by-id.service';
import { UpdateDepartmentStatus } from './application/usecases/update-department-status/update-department-status.service';
import { DepartmentAdminController } from './infra/drivers/http/admin/department-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    DepartmentPersistenceModule,
  ],
  controllers: [
    DepartmentAdminController,
  ],
  providers: [
    CreateDepartment,
    DeleteDepartment,
    EditDepartment,
    FindAllDepartment,
    FindDepartmentById,
    UpdateDepartmentStatus,
  ],
  exports: [
    FindDepartmentById,
  ],
})
export class DepartmentModule {}
