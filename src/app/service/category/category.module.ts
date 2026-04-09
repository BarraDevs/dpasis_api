import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CategoryPersistenceModule } from './application/persistence/category-persistence.module';
import { CreateCategory } from './application/usecases/create-category/create-category.service';
import { DeleteCategory } from './application/usecases/delete-category/delete-category.service';
import { EditCategory } from './application/usecases/edit-category/edit-category.service';
import { FindAllCategory } from './application/usecases/find-all-category/find-all-category.service';
import { FindCategoryById } from './application/usecases/find-category-by-id/find-category-by-id.service';
import { UpdateCategoryStatus } from './application/usecases/update-category-status/update-category-status.service';
import { CategoryAdminController } from './infra/drivers/http/admin/category-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    CategoryPersistenceModule,
  ],
  controllers: [
    CategoryAdminController,
  ],
  providers: [
    CreateCategory,
    DeleteCategory,
    EditCategory,
    FindAllCategory,
    FindCategoryById,
    UpdateCategoryStatus,
  ],
  exports: [
    FindCategoryById,
  ],
})
export class CategoryModule {}
