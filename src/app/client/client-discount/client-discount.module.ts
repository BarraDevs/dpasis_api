import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientModule } from '../client/client.module';
import { ClientDiscountPersistenceModule } from './application/persistence/client-discount-persistence.module';
import { CreateClientDiscount } from './application/usecases/create-client-discount/create-client-discount.service';
import { DeleteClientDiscount } from './application/usecases/delete-client-discount/delete-client-discount.service';
import { EditClientDiscount } from './application/usecases/edit-client-discount/edit-client-discount.service';
import { FindAllClientDiscount } from './application/usecases/find-all-client-discount/find-all-client-discount.service';
import { FindClientDiscountById } from './application/usecases/find-client-discount-by-id/find-client-discount-by-id.service';
import { ClientDiscountAdminController } from './infra/drivers/http/admin/client-discount-admin.controller';

@Module({
  imports: [
    ClientDiscountPersistenceModule,
    ClientModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientDiscountAdminController,
  ],
  providers: [
    CreateClientDiscount,
    DeleteClientDiscount,
    EditClientDiscount,
    FindAllClientDiscount,
    FindClientDiscountById,
  ],
  exports: [
    FindClientDiscountById,
  ],
})
export class ClientDiscountModule {}
