import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { WarrantyPersistenceModule } from './application/persistence/warranty-persistence.module';
import { CreateWarranty } from './application/usecases/create-warranty/create-warranty.service';
import { DeleteWarranty } from './application/usecases/delete-warranty/delete-warranty.service';
import { EditWarranty } from './application/usecases/edit-warranty/edit-warranty.service';
import { FindAllWarranty } from './application/usecases/find-all-warranty/find-all-warranty.service';
import { FindWarrantyById } from './application/usecases/find-warranty-by-id/find-warranty-by-id.service';
import { UpdateWarrantyStatus } from './application/usecases/update-warranty-status/update-warranty-status.service';
import { WarrantyAdminController } from './infra/drivers/http/admin/warranty-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    WarrantyPersistenceModule,
  ],
  controllers: [
    WarrantyAdminController,
  ],
  providers: [
    CreateWarranty,
    DeleteWarranty,
    EditWarranty,
    FindAllWarranty,
    FindWarrantyById,
    UpdateWarrantyStatus,
  ],
  exports: [
    FindWarrantyById,
  ],
})
export class WarrantyModule {}
