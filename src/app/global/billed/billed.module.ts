import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { BilledPersistenceModule } from './application/persistence/billed-persistence.module';
import { ActivateBilled } from './application/usecases/activate-billed/activate-billed.service';
import { CreateBilled } from './application/usecases/create-billed/create-billed.service';
import { DeactivateBilled } from './application/usecases/deactivate-billed/deactivate-billed.service';
import { DeleteBilled } from './application/usecases/delete-billed/delete-billed.service';
import { EditBilled } from './application/usecases/edit-billed/edit-billed.service';
import { FindAllBilled } from './application/usecases/find-all-billed/find-all-billed.service';
import { FindBilledById } from './application/usecases/find-billed-by-id/find-billed-by-id.service';
import { BilledAdminController } from './infra/drivers/http/admin/billed-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    BilledPersistenceModule,
  ],
  controllers: [
    BilledAdminController,
  ],
  providers: [
    ActivateBilled,
    CreateBilled,
    DeactivateBilled,
    DeleteBilled,
    EditBilled,
    FindAllBilled,
    FindBilledById,
  ],
  exports: [
    FindBilledById,
  ],
})
export class BilledModule {}
