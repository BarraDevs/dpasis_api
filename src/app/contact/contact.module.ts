import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { OwnerModule } from '../owner/owner.module';
import { ContactPersistenceModule } from './application/persistence/contact-persistence.module';
import { CreateContact } from './application/usecases/create-contact/create-contact.service';
import { DeleteContact } from './application/usecases/delete-contact/delete-contact.service';
import { EditContact } from './application/usecases/edit-contact/edit-contact.service';
import { FindAllContact } from './application/usecases/find-all-contact/find-all-contact.service';
import { FindContactById } from './application/usecases/find-contact-by-id/find-contact-by-id.service';
import { ContactController } from './infra/drivers/http/contact.controller';

@Module({
  imports: [
    ContactPersistenceModule,
    AuthenticationGuardsModule,
    OwnerModule,
  ],
  controllers: [
    ContactController,
  ],
  providers: [
    CreateContact,
    DeleteContact,
    EditContact,
    FindAllContact,
    FindContactById,
  ],
  exports: [],
})
export class ContactModule {}
