import { Module } from '@nestjs/common';
import { ItemPersistenceModule } from './application/persistence/item-persistence.module';
import { ItemController } from './infra/drivers/http/item.controller';

@Module({
  imports: [
    ItemPersistenceModule,
  ],
  controllers: [
    ItemController,
  ],
  providers: [
    // CreateItem,
    // DeleteItem,
    // EditItem,
    // FindAllItem,
    // FindItemById,
  ],
  exports: [],
})
export class ItemModule {}
