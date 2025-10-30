import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { AttachmentPersistenceModule } from './application/persistence/attachment-persistence.module';
import { CreateAttachment } from './application/usecases/create-attachment/create-attachment.service';
import { DeleteAttachment } from './application/usecases/delete-attachment/delete-attachment.service';
import { EditAttachment } from './application/usecases/edit-attachment/edit-attachment.service';
import { FindAllAttachment } from './application/usecases/find-all-attachment/find-all-attachment.service';
import { FindAttachmentById } from './application/usecases/find-attachment-by-id/find-attachment-by-id.service';
import { AttachmentController } from './infra/drivers/http/attachment.controller';

@Module({
  imports: [
    AttachmentPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    AttachmentController,
  ],
  providers: [
    CreateAttachment,
    DeleteAttachment,
    EditAttachment,
    FindAllAttachment,
    FindAttachmentById,
  ],
  exports: [],
})
export class AttachmentModule {}
