import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../../authentication/application/guards/guards.module';
import { ResalePersistenceModule } from './application/persistence/resale-persistence.module';
import { ActivateResale } from './application/usecases/activate-resale/activate-resale.service';
import { CreateResale } from './application/usecases/create-resale/create-resale.service';
import { DeactivateResale } from './application/usecases/deactivate-resale/deactivate-resale.service';
import { EditResale } from './application/usecases/edit-resale/edit-resale.service';
import { FindAllResale } from './application/usecases/find-all-resale/find-all-resale.service';
import { FindResaleById } from './application/usecases/find-resale-by-id/find-resale-by-id.service';
import { GetResaleSequence } from './application/usecases/get-resale-sequence/get-resale-sequence.service';
import { SetResaleNextId } from './application/usecases/set-resale-next-id/set-resale-next-id.service';
import { ResaleAdminController } from './infra/drivers/http/admin/resale-admin.controller';

@Module({
  imports: [
    ResalePersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ResaleAdminController,
  ],
  providers: [
    ActivateResale,
    CreateResale,
    DeactivateResale,
    EditResale,
    FindAllResale,
    FindResaleById,
    GetResaleSequence,
    SetResaleNextId,
  ],
  exports: [
    FindResaleById,
  ],
})
export class ResaleModule {}
