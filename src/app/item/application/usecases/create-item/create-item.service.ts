import { Inject, Injectable } from '@nestjs/common';
import { Item } from 'src/app/item/domain/entities/item.entity';
import { FindOwnerById } from 'src/app/owner/application/usecases/find-owner-by-id/find-owner-by-id.service';
import { OwnerNotFoundError } from 'src/app/owner/domain/errors/owner-not-found.error'; // Reutilizando erro
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
    // 1. Validar se o Owner existe
    const owner = await this.findOwnerById.execute(data.ownerId);
    if (!owner) {
      throw new OwnerNotFoundError();
    }

    // 2. Mapear os DTOs para Entidades de Domínio (DDD)
    const itemsToCreate: Item[] = data.items.map((itemDto) => {
      return Item.create({
        ...itemDto,
        ownerId: data.ownerId, // Atribui o ownerId pai a todos os filhos
      });
    });

    // 3. Delegar a persistência em lote para o repositório
    await this.itemRepository.createMany(itemsToCreate);

    return {
      count: itemsToCreate.length,
      ids: itemsToCreate.map((item) => item.props.id),
    };
  }
}
