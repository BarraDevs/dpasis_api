import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientDriveTypePersistenceModule } from './application/persistence/client-drive-type-persistence.module';
import { CreateClientDriveType } from './application/usecases/create-client-drive-type/create-client-drive-type.service';
import { DeleteClientDriveType } from './application/usecases/delete-client-drive-type/delete-client-drive-type.service';
import { EditClientDriveType } from './application/usecases/edit-client-drive-type/edit-client-drive-type.service';
import { FindAllClientDriveType } from './application/usecases/find-all-client-drive-type/find-all-client-drive-type.service';
import { FindClientDriveTypeById } from './application/usecases/find-client-drive-type-by-id/find-client-drive-type-by-id.service';
import { UpdateClientDriveTypeStatus } from './application/usecases/update-client-drive-type-status/update-client-drive-type-status.service';
import { ClientDriveTypeAdminController } from './infra/drivers/http/admin/client-drive-type-admin.controller';

@Module({
  imports: [
    ClientDriveTypePersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientDriveTypeAdminController,
  ],
  providers: [
    CreateClientDriveType,
    DeleteClientDriveType,
    EditClientDriveType,
    FindAllClientDriveType,
    FindClientDriveTypeById,
    UpdateClientDriveTypeStatus,
  ],
  exports: [
    FindClientDriveTypeById,
  ],
})
export class ClientDriveTypeModule {}
