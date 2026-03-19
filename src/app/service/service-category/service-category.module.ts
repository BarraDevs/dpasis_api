import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceCategoryPersistenceModule } from './application/persistence/service-category-persistence.module';
import { CreateServiceCategory } from './application/usecases/create-service-category/create-service-category.service';
import { DeleteServiceCategory } from './application/usecases/delete-service-category/delete-service-category.service';
import { EditServiceCategory } from './application/usecases/edit-service-category/edit-service-category.service';
import { FindAllServiceCategory } from './application/usecases/find-all-service-category/find-all-service-category.service';
import { FindServiceCategoryById } from './application/usecases/find-service-category-by-id/find-service-category-by-id.service';
import { UpdateServiceCategoryStatus } from './application/usecases/update-service-category-status/update-service-category-status.service';
import { ServiceCategoryAdminController } from './infra/drivers/http/admin/service-category-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    ServiceCategoryPersistenceModule,
  ],
  controllers: [
    ServiceCategoryAdminController,
  ],
  providers: [
    CreateServiceCategory,
    DeleteServiceCategory,
    EditServiceCategory,
    FindAllServiceCategory,
    FindServiceCategoryById,
    UpdateServiceCategoryStatus,
  ],
  exports: [
    FindServiceCategoryById,
  ],
})
export class ServiceCategoryModule {}
