import { Inject, Injectable } from '@nestjs/common';
import { Item } from 'src/app/item/domain/entities/item.entity';
import { FindOwnerById } from 'src/app/owner/application/usecases/find-owner-by-id/find-owner-by-id.service';
import { OwnerNotActiveError } from 'src/app/owner/domain/errors/owner-not-active.error';
import { TOKENS } from 'src/core/di/token';
import type { IItemRepository } from '../../persistence/repository/item-repository.interface';
import { CreateItemsInputDto, CreateItemsOutputDto } from './dtos/create-item.dto';

@Injectable()
export class CreateItems {
  constructor(
    @Inject(TOKENS.ItemRepository) private readonly itemRepository: IItemRepository,
    private readonly findOwnerById: FindOwnerById,
  ) {}

  public async execute(data: CreateItemsInputDto): Promise<CreateItemsOutputDto> {
    const owner = await this.findOwnerById.execute(data.ownerId);
    if (!owner.active) {
      throw new OwnerNotActiveError();
    }

    const itemsToCreate: Item[] = data.items.map((itemDto) => {
      return Item.create({
        ...itemDto,
        ownerId: data.ownerId,
      });
    });

    await this.itemRepository.createMany(itemsToCreate);

    return {
      count: itemsToCreate.length,
      ids: itemsToCreate.map((item) => item.props.id),
    };
  }
}
