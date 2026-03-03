import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ClientModule } from 'src/app/client/client/client.module';
import { ClientItemPersistenceModule } from './application/persistence/client-item-persistence.module';
import { CreateBulkClientItem } from './application/usecases/create-bulk-client-item/create-bulk-client-item.service';
import { CreateClientItem } from './application/usecases/create-client-item/create-client-item.service';
import { DeleteBulkClientItem } from './application/usecases/delete-bulk-client-item/delete-bulk-client-item.service';
import { DeleteClientItem } from './application/usecases/delete-client-item/delete-client-item.service';
import { EditClientItem } from './application/usecases/edit-client-item/edit-client-item.service';
import { FindAllClientItem } from './application/usecases/find-all-client-item/find-all-client-item.service';
import { FindClientItemById } from './application/usecases/find-client-item-by-id/find-client-item-by-id.service';
import { ClientItemAdminController } from './infra/drivers/http/admin/client-item-admin.controller';

@Module({
  imports: [
    ClientItemPersistenceModule,
    ClientModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ClientItemAdminController,
  ],
  providers: [
    CreateBulkClientItem,
    CreateClientItem,
    DeleteBulkClientItem,
    DeleteClientItem,
    EditClientItem,
    FindAllClientItem,
    FindClientItemById,
  ],
  exports: [FindClientItemById],
})
export class ClientItemModule {}
