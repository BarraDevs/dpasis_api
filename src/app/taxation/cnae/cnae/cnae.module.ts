import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CnaePersistenceModule } from './application/persistence/cnae-persistence.module';
import { CreateCnae } from './application/usecases/create-cnae/create-cnae.service';
import { EditCnae } from './application/usecases/edit-cnae/edit-cnae.service';
import { FindAllCnae } from './application/usecases/find-all-cnae/find-all-cnae.service';
import { FindCnaeById } from './application/usecases/find-cnae-by-id/find-cnae-by-id.service';
import { UpdateCnaeStatus } from './application/usecases/update-cnae-status/update-cnae-status.service';
import { CnaeAdminController } from './infra/drivers/http/admin/cnae-admin.controller';

@Module({
  imports: [
    CnaePersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    CnaeAdminController,
  ],
  providers: [
    CreateCnae,
    EditCnae,
    FindAllCnae,
    FindCnaeById,
    UpdateCnaeStatus,
  ],
  exports: [
    CnaePersistenceModule,
    FindCnaeById,
  ],
})
export class CnaeModule {}
