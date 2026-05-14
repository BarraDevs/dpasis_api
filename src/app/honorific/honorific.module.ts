import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { HonorificPersistenceModule } from './application/persistence/honorific-persistence.module';
import { CreateHonorific } from './application/usecases/create-honorific/create-honorific.service';
import { DeleteHonorific } from './application/usecases/delete-honorific/delete-honorific.service';
import { EditHonorific } from './application/usecases/edit-honorific/edit-honorific.service';
import { FindAllHonorific } from './application/usecases/find-all-honorific/find-all-honorific.service';
import { FindHonorificById } from './application/usecases/find-honorific-by-id/find-honorific-by-id.service';
import { UpdateHonorificStatus } from './application/usecases/update-honorific-status/update-honorific-status.service';
import { HonorificAdminController } from './infra/drivers/http/admin/honorific-admin.controller';

@Module({
  imports: [
    HonorificPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    HonorificAdminController,
  ],
  providers: [
    CreateHonorific,
    DeleteHonorific,
    EditHonorific,
    FindAllHonorific,
    FindHonorificById,
    UpdateHonorificStatus,
  ],
  exports: [
    FindHonorificById,
  ],
})
export class HonorificModule {}
