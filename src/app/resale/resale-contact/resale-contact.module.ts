import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ResaleDepartmentModule } from 'src/app/resale/resale-department/resale-department.module';
import { ResaleModule } from 'src/app/resale/resale/resale.module';
import { ResaleContactPersistenceModule } from './application/persistence/resale-contact-persistence.module';
import { ActivateResaleContact } from './application/usecases/activate-resale-contact/activate-resale-contact.service';
import { CreateResaleContact } from './application/usecases/create-resale-contact/create-resale-contact.service';
import { DeactivateResaleContact } from './application/usecases/deactivate-resale-contact/deactivate-resale-contact.service';
import { DeleteResaleContact } from './application/usecases/delete-resale-contact/delete-resale-contact.service';
import { EditResaleContact } from './application/usecases/edit-resale-contact/edit-resale-contact.service';
import { FindAllResaleContact } from './application/usecases/find-all-resale-contact/find-all-resale-contact.service';
import { FindResaleContactById } from './application/usecases/find-resale-contact-by-id/find-resale-contact-by-id.service';
import { ResaleContactAdminController } from './infra/drivers/http/admin/resale-contact-admin.controller';

@Module({
  imports: [
    ResaleContactPersistenceModule,
    ResaleModule,
    ResaleDepartmentModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ResaleContactAdminController,
  ],
  providers: [
    CreateResaleContact,
    DeleteResaleContact,
    EditResaleContact,
    FindAllResaleContact,
    FindResaleContactById,
    ActivateResaleContact,
    DeactivateResaleContact,
  ],
  exports: [
    FindResaleContactById,
  ],
})
export class ResaleContactModule {}
