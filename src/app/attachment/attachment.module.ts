import { Module } from '@nestjs/common';
import { AttachmentPersistenceModule } from './application/persistence/attachment-persistence.module';
import { AttachmentController } from './infra/drivers/http/attachment.controller';

@Module({
  imports: [
    AttachmentPersistenceModule,
  ],
  controllers: [
    AttachmentController,
  ],
  providers: [
    // CreateAttachment,
    // DeleteAttachment,
    // EditAttachment,
    // FindAllAttachment,
    // FindAttachmentById,
  ],
  exports: [],
})
export class AttachmentModule {}
