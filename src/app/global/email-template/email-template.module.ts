import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { EmailTemplateVariableModule } from 'src/app/global/email-template-variable/email-template-variable.module';
import { EmailTemplatePersistenceModule } from './application/persistence/email-template-persistence.module';
import { CreateEmailTemplate } from './application/usecases/create-email-template/create-email-template.service';
import { DeleteEmailTemplate } from './application/usecases/delete-email-template/delete-email-template.service';
import { EditEmailTemplate } from './application/usecases/edit-email-template/edit-email-template.service';
import { FindAllEmailTemplate } from './application/usecases/find-all-email-template/find-all-email-template.service';
import { FindEmailTemplateById } from './application/usecases/find-email-template-by-id/find-email-template-by-id.service';
import { RenderEmailTemplate } from './application/usecases/render-email-template/render-email-template.service';
import { UpdateEmailTemplateStatus } from './application/usecases/update-email-template-status/update-email-template-status.service';
import { EmailTemplateAdminController } from './infra/drivers/http/admin/email-template-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    EmailTemplatePersistenceModule,
    EmailTemplateVariableModule,
  ],
  controllers: [
    EmailTemplateAdminController,
  ],
  providers: [
    CreateEmailTemplate,
    DeleteEmailTemplate,
    EditEmailTemplate,
    FindAllEmailTemplate,
    FindEmailTemplateById,
    RenderEmailTemplate,
    UpdateEmailTemplateStatus,
  ],
})
export class EmailTemplateModule {}
