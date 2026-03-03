import { Inject, Injectable } from '@nestjs/common';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { ClientItemFactory } from '../../../domain/factories/client-item.factory';
import type { IClientItemRepository } from '../../persistence/repository/client-item-repository.interface';
import { CreateClientItemInputDto, CreateClientItemOutputDto } from './dtos/create-client-item.dto';

@Injectable()
export class CreateClientItem {
  constructor(
    @Inject(TOKENS.ClientItemRepository) private readonly clientItemRepository: IClientItemRepository,
    private readonly findClientById: FindClientById,
  ) {}

  public async execute(data: CreateClientItemInputDto): Promise<CreateClientItemOutputDto> {
    const client = await this.findClientById.execute(data.clientId, true);

    const entity = ClientItemFactory.create({
      clientId: client.id,
      description: data.description,
      quantity: data.quantity,
      unitValueInCents: data.unitValueInCents,
      cnae: data.cnae,
      nbs: data.nbs,
      indop: data.indop,
    });

    const id = await this.clientItemRepository.save(entity);

    return { id };
  }
}
