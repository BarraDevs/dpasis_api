import { Inject, Injectable } from '@nestjs/common';
import { Item } from 'src/app/item/domain/entities/item.entity';
import { ItemNotFoundError } from 'src/app/item/domain/errors/item-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import type { IItemDao } from '../../persistence/dao/item-dao.interface';
import type { IItemRepository } from '../../persistence/repository/item-repository.interface';
import { EditItemInputDto } from './dtos/edit-item.dto';

@Injectable()
export class EditItem {
  constructor(
    @Inject(TOKENS.ItemDao) private readonly itemDao: IItemDao,
    @Inject(TOKENS.ItemRepository) private readonly itemRepository: IItemRepository,
  ) {}

  public async execute(id: string, data: EditItemInputDto): Promise<SuccessMessage> {
    const itemDto = await this.itemDao.findById(id);
    if (!itemDto) {
      throw new ItemNotFoundError();
    }

    const item = Item.load({
      ...itemDto,
      ...data,
      ownerId: itemDto.ownerId,
      updatedAt: UTCDate.create().value,
    });
    await this.itemRepository.edit(item);

    return { message: 'Item atualizado com sucesso!' };
  }
}
