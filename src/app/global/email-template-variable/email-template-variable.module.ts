import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { EmailTemplateVariablePersistenceModule } from './application/persistence/email-template-variable-persistence.module';
import { CreateEmailTemplateVariable } from './application/usecases/create-email-template-variable/create-email-template-variable.service';
import { DeleteEmailTemplateVariable } from './application/usecases/delete-email-template-variable/delete-email-template-variable.service';
import { EditEmailTemplateVariable } from './application/usecases/edit-email-template-variable/edit-email-template-variable.service';
import { FindActiveEmailTemplateVariablesByKeys } from './application/usecases/find-active-email-template-variables-by-keys/find-active-email-template-variables-by-keys.service';
import { FindAllEmailTemplateVariable } from './application/usecases/find-all-email-template-variable/find-all-email-template-variable.service';
import { FindEmailTemplateVariableById } from './application/usecases/find-email-template-variable-by-id/find-email-template-variable-by-id.service';
import { UpdateEmailTemplateVariableStatus } from './application/usecases/update-email-template-variable-status/update-email-template-variable-status.service';
import { EmailTemplateVariableAdminController } from './infra/drivers/http/admin/email-template-variable-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    EmailTemplateVariablePersistenceModule,
  ],
  controllers: [
    EmailTemplateVariableAdminController,
  ],
  providers: [
    CreateEmailTemplateVariable,
    DeleteEmailTemplateVariable,
    EditEmailTemplateVariable,
    FindActiveEmailTemplateVariablesByKeys,
    FindAllEmailTemplateVariable,
    FindEmailTemplateVariableById,
    UpdateEmailTemplateVariableStatus,
  ],
  exports: [
    FindActiveEmailTemplateVariablesByKeys,
  ],
})
export class EmailTemplateVariableModule {}
