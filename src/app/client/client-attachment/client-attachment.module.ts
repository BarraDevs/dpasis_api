import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
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
    AuthenticationGuardsModule,
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
