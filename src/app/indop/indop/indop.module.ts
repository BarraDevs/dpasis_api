import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { IndopPersistenceModule } from './application/persistence/indop-persistence.module';
import { CreateIndop } from './application/usecases/create-indop/create-indop.service';
import { EditIndop } from './application/usecases/edit-indop/edit-indop.service';
import { FindAllIndop } from './application/usecases/find-all-indop/find-all-indop.service';
import { FindIndopById } from './application/usecases/find-indop-by-id/find-indop-by-id.service';
import { UpdateIndopStatus } from './application/usecases/update-indop-status/update-indop-status.service';
import { IndopAdminController } from './infra/drivers/http/admin/indop-admin.controller';

@Module({
  imports: [
    IndopPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    IndopAdminController,
  ],
  providers: [
    CreateIndop,
    EditIndop,
    FindAllIndop,
    FindIndopById,
    UpdateIndopStatus,
  ],
  exports: [
    IndopPersistenceModule,
    FindIndopById,
  ],
})
export class IndopModule {}
