import { Inject, Injectable } from '@nestjs/common';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { FindCnaeNbsIndopById } from 'src/app/taxation/cnae-nbs-indop/application/usecases/find-cnae-nbs-indop-by-id/find-cnae-nbs-indop-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { ClientItemFactory } from '../../../domain/factories/client-item.factory';
import type { IClientItemRepository } from '../../persistence/repository/client-item-repository.interface';
import { CreateClientItemInputDto, CreateClientItemOutputDto } from './dtos/create-client-item.dto';

@Injectable()
export class CreateClientItem {
  constructor(
    @Inject(TOKENS.ClientItemRepository) private readonly clientItemRepository: IClientItemRepository,
    private readonly findCnaeNbsIndopById: FindCnaeNbsIndopById,
    private readonly findClientById: FindClientById,
  ) {}

  public async execute(data: CreateClientItemInputDto): Promise<CreateClientItemOutputDto> {
    const client = await this.findClientById.execute(data.clientId, { onlyActive: true });
    const cnaeNbsIndop = await this.findCnaeNbsIndopById.execute(data.cnaeNbsIndopId);

    const entity = ClientItemFactory.create({
      clientId: client.id,
      cnaeNbsIndopId: cnaeNbsIndop.id,
      description: data.description,
      quantity: data.quantity,
      unitValueInCents: data.unitValueInCents,
    });

    const id = await this.clientItemRepository.save(entity);

    return { id };
  }
}
