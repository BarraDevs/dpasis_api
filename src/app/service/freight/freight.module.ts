import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { FreightPersistenceModule } from './application/persistence/freight-persistence.module';
import { CreateFreight } from './application/usecases/create-freight/create-freight.service';
import { DeleteFreight } from './application/usecases/delete-freight/delete-freight.service';
import { EditFreight } from './application/usecases/edit-freight/edit-freight.service';
import { FindAllFreight } from './application/usecases/find-all-freight/find-all-freight.service';
import { FindFreightById } from './application/usecases/find-freight-by-id/find-freight-by-id.service';
import { UpdateFreightStatus } from './application/usecases/update-freight-status/update-freight-status.service';
import { FreightAdminController } from './infra/drivers/http/admin/freight-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    FreightPersistenceModule,
  ],
  controllers: [
    FreightAdminController,
  ],
  providers: [
    CreateFreight,
    DeleteFreight,
    EditFreight,
    FindAllFreight,
    FindFreightById,
    UpdateFreightStatus,
  ],
  exports: [
    FindFreightById,
  ],
})
export class FreightModule {}
