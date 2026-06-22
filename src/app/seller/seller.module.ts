import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { SellerPersistenceModule } from './application/persistence/seller-persistence.module';
import { ActivateSeller } from './application/usecases/activate-seller/activate-seller.service';
import { CreateSeller } from './application/usecases/create-seller/create-seller.service';
import { DeactivateSeller } from './application/usecases/deactivate-seller/deactivate-seller.service';
import { DeleteSeller } from './application/usecases/delete-seller/delete-seller.service';
import { EditSeller } from './application/usecases/edit-seller/edit-seller.service';
import { FindAllSeller } from './application/usecases/find-all-seller/find-all-seller.service';
import { FindSellerById } from './application/usecases/find-seller-by-id/find-seller-by-id.service';
import { SellerAdminController } from './infra/drivers/http/admin/seller-admin.controller';

@Module({
  imports: [
    SellerPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    SellerAdminController,
  ],
  providers: [
    ActivateSeller,
    CreateSeller,
    DeactivateSeller,
    DeleteSeller,
    EditSeller,
    FindAllSeller,
    FindSellerById,
  ],
  exports: [
    FindSellerById,
  ],
})
export class SellerModule {}
