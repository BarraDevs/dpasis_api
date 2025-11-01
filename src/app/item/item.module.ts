import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { OwnerModule } from '../owner/owner.module';
import { ItemPersistenceModule } from './application/persistence/item-persistence.module';
import { CreateItems } from './application/usecases/create-item/create-item.service';
import { DeleteItem } from './application/usecases/delete-item/delete-item.service';
import { EditItem } from './application/usecases/edit-item/edit-item.service';
import { FindAllItem } from './application/usecases/find-all-item/find-all-item.service';
import { FindItemById } from './application/usecases/find-item-by-id/find-item-by-id.service';
import { ItemController } from './infra/drivers/http/item.controller';

@Module({
  imports: [
    ItemPersistenceModule,
    AuthenticationGuardsModule,
    OwnerModule,
  ],
  controllers: [
    ItemController,
  ],
  providers: [
    CreateItems,
    DeleteItem,
    EditItem,
    FindAllItem,
    FindItemById,
  ],
  exports: [],
})
export class ItemModule {}
