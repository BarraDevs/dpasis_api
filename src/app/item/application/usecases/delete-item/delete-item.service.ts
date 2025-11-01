import { Inject, Injectable } from '@nestjs/common';
import { ItemNotFoundError } from 'src/app/item/domain/errors/item-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IItemDao } from '../../persistence/dao/item-dao.interface';
import type { IItemRepository } from '../../persistence/repository/item-repository.interface';

@Injectable()
export class DeleteItem {
  constructor(
    @Inject(TOKENS.ItemDao) private readonly itemDao: IItemDao,
    @Inject(TOKENS.ItemRepository) private readonly itemRepository: IItemRepository,
  ) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const item = await this.itemDao.findById(id);
    if (!item) {
      throw new ItemNotFoundError();
    }
    await this.itemRepository.delete(id);

    return { message: 'Item deletado com sucesso!' };
  }
}
