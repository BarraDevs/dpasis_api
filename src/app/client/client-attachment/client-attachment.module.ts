import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { UploadFileQueueModule } from 'src/app/upload-file/application/queue/upload-file-queue.module';
import { UploadFileModule } from 'src/app/upload-file/upload-file.module';
import { ClientModule } from '../client/client.module';
import { ClientAttachmentPersistenceModule } from './application/persistence/client-attachment-persistence.module';
import { CreateClientAttachment } from './application/usecases/create-client-attachment/create-client-attachment.service';
import { DeleteClientAttachment } from './application/usecases/delete-client-attachment/delete-client-attachment.service';
import { EditClientAttachment } from './application/usecases/edit-client-attachment/edit-client-attachment.service';
import { FindAllClientAttachment } from './application/usecases/find-all-client-attachment/find-all-client-attachment.service';
import { FindClientAttachmentById } from './application/usecases/find-client-attachment-by-id/find-client-attachment-by-id.service';
import { UpdateClientAttachmentStatus } from './application/usecases/update-client-attachment-status/update-client-attachment-status.service';
import { ClientAttachmentAdminController } from './infra/drivers/http/admin/client-attachment-admin.controller';

@Module({
  imports: [
    ClientAttachmentPersistenceModule,
    ClientModule,
    AuthenticationGuardsModule,
    UploadFileModule,
    UploadFileQueueModule.register(),
  ],
  controllers: [
    ClientAttachmentAdminController,
  ],
  providers: [
    CreateClientAttachment,
    DeleteClientAttachment,
    EditClientAttachment,
    FindAllClientAttachment,
    FindClientAttachmentById,
    UpdateClientAttachmentStatus,
  ],
})
export class ClientAttachmentModule {}
