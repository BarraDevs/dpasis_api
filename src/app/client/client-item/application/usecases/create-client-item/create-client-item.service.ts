import { Inject, Injectable } from '@nestjs/common';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { CnaeNbsIndopNotFoundError } from 'src/app/taxation/cnae-nbs-indop/cnae-nbs-indop/domain/errors/cnae-nbs-indop-not-found.error';
import { TOKENS } from 'src/core/di/token';
import type { ICnaeNbsIndopDao } from 'src/app/taxation/cnae-nbs-indop/cnae-nbs-indop/application/persistence/dao/cnae-nbs-indop-dao.interface';
import { ClientItemFactory } from '../../../domain/factories/client-item.factory';
import type { IClientItemRepository } from '../../persistence/repository/client-item-repository.interface';
import { CreateClientItemInputDto, CreateClientItemOutputDto } from './dtos/create-client-item.dto';

@Injectable()
export class CreateClientItem {
  constructor(
    @Inject(TOKENS.ClientItemRepository) private readonly clientItemRepository: IClientItemRepository,
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
    private readonly findClientById: FindClientById,
  ) {}

  public async execute(data: CreateClientItemInputDto): Promise<CreateClientItemOutputDto> {
    const client = await this.findClientById.execute(data.clientId, true);

    const cnaeNbsIndop = await this.cnaeNbsIndopDao.findById(data.cnaeNbsIndopId);
    if (!cnaeNbsIndop) {
      throw new CnaeNbsIndopNotFoundError();
    }

    const entity = ClientItemFactory.create({
      clientId: client.id,
      description: data.description,
      quantity: data.quantity,
      unitValueInCents: data.unitValueInCents,
      cnaeNbsIndopId: data.cnaeNbsIndopId,
    });

    const id = await this.clientItemRepository.save(entity);

    return { id };
  }
}
