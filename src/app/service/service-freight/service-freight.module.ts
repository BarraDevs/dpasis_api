import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceFreightPersistenceModule } from './application/persistence/service-freight-persistence.module';
import { CreateServiceFreight } from './application/usecases/create-service-freight/create-service-freight.service';
import { DeleteServiceFreight } from './application/usecases/delete-service-freight/delete-service-freight.service';
import { EditServiceFreight } from './application/usecases/edit-service-freight/edit-service-freight.service';
import { FindAllServiceFreight } from './application/usecases/find-all-service-freight/find-all-service-freight.service';
import { FindServiceFreightById } from './application/usecases/find-service-freight-by-id/find-service-freight-by-id.service';
import { UpdateServiceFreightStatus } from './application/usecases/update-service-freight-status/update-service-freight-status.service';
import { ServiceFreightAdminController } from './infra/drivers/http/admin/service-freight-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    ServiceFreightPersistenceModule,
  ],
  controllers: [
    ServiceFreightAdminController,
  ],
  providers: [
    CreateServiceFreight,
    DeleteServiceFreight,
    EditServiceFreight,
    FindAllServiceFreight,
    FindServiceFreightById,
    UpdateServiceFreightStatus,
  ],
  exports: [
    FindServiceFreightById,
  ],
})
export class ServiceFreightModule {}
