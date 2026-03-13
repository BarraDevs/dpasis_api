import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientDescriptionTypePersistenceModule } from './application/persistence/client-description-type-persistence.module';
import { CreateClientDescriptionType } from './application/usecases/create-client-description-type/create-client-description-type.service';
import { DeleteClientDescriptionType } from './application/usecases/delete-client-description-type/delete-client-description-type.service';
import { EditClientDescriptionType } from './application/usecases/edit-client-description-type/edit-client-description-type.service';
import { FindAllClientDescriptionType } from './application/usecases/find-all-client-description-type/find-all-client-description-type.service';
import { FindClientDescriptionTypeById } from './application/usecases/find-client-description-type-by-id/find-client-description-type-by-id.service';
import { UpdateClientDescriptionTypeStatus } from './application/usecases/update-client-description-type-status/update-client-description-type-status.service';
import { ClientDescriptionTypeAdminController } from './infra/drivers/http/admin/client-description-type-admin.controller';

@Module({
  imports: [
    ClientDescriptionTypePersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientDescriptionTypeAdminController,
  ],
  providers: [
    CreateClientDescriptionType,
    DeleteClientDescriptionType,
    EditClientDescriptionType,
    FindAllClientDescriptionType,
    FindClientDescriptionTypeById,
    UpdateClientDescriptionTypeStatus,
  ],
  exports: [
    FindClientDescriptionTypeById,
  ],
})
export class ClientDescriptionTypeModule {}
