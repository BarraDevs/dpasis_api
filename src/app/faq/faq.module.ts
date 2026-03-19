import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { FaqPersistenceModule } from './application/persistence/faq-persistence.module';
import { CreateFaq } from './application/usecases/create-faq/create-faq.service';
import { DeleteFaq } from './application/usecases/delete-faq/delete-faq.service';
import { EditFaq } from './application/usecases/edit-faq/edit-faq.service';
import { FindAllFaq } from './application/usecases/find-all-faq/find-all-faq.service';
import { FindFaqById } from './application/usecases/find-faq-by-id/find-faq-by-id.service';
import { UpdateFaqStatus } from './application/usecases/update-faq-status/update-faq-status.service';
import { FaqAdminController } from './infra/drivers/http/admin/faq-admin.controller';
import { FaqUserController } from './infra/drivers/http/user/faq-user.controller';

@Module({
  imports: [
    FaqPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    FaqAdminController,
    FaqUserController,
  ],
  providers: [
    CreateFaq,
    DeleteFaq,
    EditFaq,
    FindAllFaq,
    FindFaqById,
    UpdateFaqStatus,
  ],
})
export class FaqModule {}
