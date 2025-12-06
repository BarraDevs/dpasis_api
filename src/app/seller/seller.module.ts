import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { CompanyModule } from '../company/company.module';
import { SellerPersistenceModule } from './application/persistence/seller-persistence.module';
import { CreateSeller } from './application/usecases/create-seller/create-seller.service';
import { EditSeller } from './application/usecases/edit-seller/edit-seller.service';
import { FindAllSeller } from './application/usecases/find-all-seller/find-all-seller.service';
import { FindSellerById } from './application/usecases/find-seller-by-id/find-seller-by-id.service';
import { UpdateSellerStatus } from './application/usecases/update-seller-status/update-seller-status.service';
import { SellerController } from './infra/drivers/http/seller.controller';

@Module({
  imports: [
    SellerPersistenceModule,
    AuthenticationGuardsModule,
    CompanyModule,
  ],
  controllers: [
    SellerController,
  ],
  providers: [
    CreateSeller,
    EditSeller,
    FindAllSeller,
    FindSellerById,
    UpdateSellerStatus,
  ],
  exports: [],
})
export class SellerModule {}
