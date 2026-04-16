import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { UploadFileQueueModule } from 'src/app/upload-file/application/queue/upload-file-queue.module';
import { UploadFileModule } from 'src/app/upload-file/upload-file.module';
import { ClientSystemTypePersistenceModule } from './application/persistence/client-system-type-persistence.module';
import { CreateClientSystemType } from './application/usecases/create-client-system-type/create-client-system-type.service';
import { DeleteClientSystemType } from './application/usecases/delete-client-system-type/delete-client-system-type.service';
import { EditClientSystemType } from './application/usecases/edit-client-system-type/edit-client-system-type.service';
import { FindAllClientSystemType } from './application/usecases/find-all-client-system-type/find-all-client-system-type.service';
import { FindClientSystemTypeById } from './application/usecases/find-client-system-type-by-id/find-client-system-type-by-id.service';
import { UpdateClientSystemTypeStatus } from './application/usecases/update-client-system-type-status/update-client-system-type-status.service';
import { ClientSystemTypeAdminController } from './infra/drivers/http/admin/client-system-type-admin.controller';

@Module({
  imports: [
    ClientSystemTypePersistenceModule,
    AuthenticationGuardsModule,
    UploadFileModule,
    UploadFileQueueModule.register(),
  ],
  controllers: [
    ClientSystemTypeAdminController,
  ],
  providers: [
    CreateClientSystemType,
    DeleteClientSystemType,
    EditClientSystemType,
    FindAllClientSystemType,
    FindClientSystemTypeById,
    UpdateClientSystemTypeStatus,
  ],
  exports: [
    FindClientSystemTypeById,
  ],
})
export class ClientSystemTypeModule {}
