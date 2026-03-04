import { Inject, Injectable } from '@nestjs/common';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { CnaeNbsIndopNotFoundError } from 'src/app/taxation/cnae-nbs-indop/cnae-nbs-indop/domain/errors/cnae-nbs-indop-not-found.error';
import { TOKENS } from 'src/core/di/token';
import type { ICnaeNbsIndopDao } from 'src/app/taxation/cnae-nbs-indop/cnae-nbs-indop/application/persistence/dao/cnae-nbs-indop-dao.interface';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientItemNotFoundError } from '../../../domain/errors/client-item-not-found.error';
import { ClientItemFactory } from '../../../domain/factories/client-item.factory';
import type { IClientItemRepository } from '../../persistence/repository/client-item-repository.interface';
import { EditClientItemInputDto } from './dtos/edit-client-item.dto';

@Injectable()
export class EditClientItem {
  constructor(
    @Inject(TOKENS.ClientItemRepository) private readonly clientItemRepository: IClientItemRepository,
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
    private readonly findClientById: FindClientById,
  ) {}

  public async execute(id: number, data: EditClientItemInputDto): Promise<SuccessMessage> {
    const existing = await this.clientItemRepository.findById(id);
    if (!existing) {
      throw new ClientItemNotFoundError();
    }

    await this.findClientById.execute(existing.props.clientId, true);

    if (data.cnaeNbsIndopId != null) {
      const cnaeNbsIndop = await this.cnaeNbsIndopDao.findById(data.cnaeNbsIndopId);
      if (!cnaeNbsIndop) {
        throw new CnaeNbsIndopNotFoundError();
      }
    }

    const entity = ClientItemFactory.edit(existing, {
      description: data.description,
      quantity: data.quantity,
      unitValueInCents: data.unitValueInCents,
      cnaeNbsIndopId: data.cnaeNbsIndopId,
    });

    await this.clientItemRepository.edit(entity);

    return { message: 'Item do cliente atualizado com sucesso' };
  }
}
