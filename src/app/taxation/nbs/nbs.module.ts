import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { NbsPersistenceModule } from './application/persistence/nbs-persistence.module';
import { CreateNbs } from './application/usecases/create-nbs/create-nbs.service';
import { DeleteNbs } from './application/usecases/delete-nbs/delete-nbs.service';
import { EditNbs } from './application/usecases/edit-nbs/edit-nbs.service';
import { FindAllNbs } from './application/usecases/find-all-nbs/find-all-nbs.service';
import { FindNbsById } from './application/usecases/find-nbs-by-id/find-nbs-by-id.service';
import { UpdateNbsStatus } from './application/usecases/update-nbs-status/update-nbs-status.service';
import { NbsAdminController } from './infra/drivers/http/admin/nbs-admin.controller';

@Module({
  imports: [
    NbsPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    NbsAdminController,
  ],
  providers: [
    CreateNbs,
    DeleteNbs,
    EditNbs,
    FindAllNbs,
    FindNbsById,
    UpdateNbsStatus,
  ],
  exports: [
    FindNbsById,
  ],
})
export class NbsModule {}
