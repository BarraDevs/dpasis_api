import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { AdminPersistenceModule } from './application/persistence/admin-persistence.module';
import { ActivateAdmin } from './application/usecases/activate-admin/activate-admin.service';
import { CreateAdmin } from './application/usecases/create-admin/create-admin.service';
import { DeactivateAdmin } from './application/usecases/deactivate-admin/deactivate-admin.service';
import { EditAdmin } from './application/usecases/edit-admin/edit-admin.service';
import { FindAdminById } from './application/usecases/find-admin-by-id/find-admin-by-id.service';
import { FindAllAdmin } from './application/usecases/find-all-admin/find-all-admin.service';
import { FindPermissionSubjects } from './application/usecases/find-permission-subjects/find-permission-subjects.service';
import { AdminAdminController } from './infra/drivers/http/admin/admin-admin.controller';

@Module({
  imports: [
    AdminPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    AdminAdminController,
  ],
  providers: [
    ActivateAdmin,
    CreateAdmin,
    EditAdmin,
    FindAllAdmin,
    FindAdminById,
    FindPermissionSubjects,
    DeactivateAdmin,
  ],
  exports: [
    FindAdminById,
  ],
})
export class AdminModule {}
