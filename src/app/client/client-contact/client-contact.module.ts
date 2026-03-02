import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientDepartmentModule } from 'src/app/client/client-department/client-department.module';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientContactPersistenceModule } from './application/persistence/client-contact-persistence.module';
import { CreateClientContact } from './application/usecases/create-client-contact/create-client-contact.service';
import { DeleteClientContact } from './application/usecases/delete-client-contact/delete-client-contact.service';
import { EditClientContact } from './application/usecases/edit-client-contact/edit-client-contact.service';
import { FindAllClientContact } from './application/usecases/find-all-client-contact/find-all-client-contact.service';
import { FindClientContactById } from './application/usecases/find-client-contact-by-id/find-client-contact-by-id.service';
import { ClientContactAdminController } from './infra/drivers/http/admin/client-contact-admin.controller';

@Module({
  imports: [
    ClientContactPersistenceModule,
    ClientModule,
    ClientDepartmentModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientContactAdminController,
  ],
  providers: [
    CreateClientContact,
    DeleteClientContact,
    EditClientContact,
    FindAllClientContact,
    FindClientContactById,
  ],
  exports: [FindClientContactById],
})
export class ClientContactModule {}
