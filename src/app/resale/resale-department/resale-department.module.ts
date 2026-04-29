import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ResaleDepartmentPersistenceModule } from './application/persistence/resale-department-persistence.module';
import { CreateResaleDepartment } from './application/usecases/create-resale-department/create-resale-department.service';
import { DeleteResaleDepartment } from './application/usecases/delete-resale-department/delete-resale-department.service';
import { EditResaleDepartment } from './application/usecases/edit-resale-department/edit-resale-department.service';
import { FindAllResaleDepartment } from './application/usecases/find-all-resale-department/find-all-resale-department.service';
import { FindResaleDepartmentById } from './application/usecases/find-resale-department-by-id/find-resale-department-by-id.service';
import { UpdateResaleDepartmentStatus } from './application/usecases/update-resale-department-status/update-resale-department-status.service';
import { ResaleDepartmentAdminController } from './infra/drivers/http/admin/resale-department-admin.controller';

@Module({
  imports: [
    ResaleDepartmentPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ResaleDepartmentAdminController,
  ],
  providers: [
    CreateResaleDepartment,
    DeleteResaleDepartment,
    EditResaleDepartment,
    FindAllResaleDepartment,
    FindResaleDepartmentById,
    UpdateResaleDepartmentStatus,
  ],
  exports: [
    FindResaleDepartmentById,
  ],
})
export class ResaleDepartmentModule {}
