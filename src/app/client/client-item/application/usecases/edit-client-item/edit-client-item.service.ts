import { Inject, Injectable } from '@nestjs/common';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { FindCnaeNbsIndopById } from 'src/app/taxation/cnae-nbs-indop/cnae-nbs-indop/application/usecases/find-cnae-nbs-indop-by-id/find-cnae-nbs-indop-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientItemNotFoundError } from '../../../domain/errors/client-item-not-found.error';
import { ClientItemFactory } from '../../../domain/factories/client-item.factory';
import type { IClientItemRepository } from '../../persistence/repository/client-item-repository.interface';
import { EditClientItemInputDto } from './dtos/edit-client-item.dto';

@Injectable()
export class EditClientItem {
  constructor(
    @Inject(TOKENS.ClientItemRepository) private readonly clientItemRepository: IClientItemRepository,
    private readonly findCnaeNbsIndopById: FindCnaeNbsIndopById,
    private readonly findClientById: FindClientById,
  ) {}

  public async execute(id: number, data: EditClientItemInputDto): Promise<SuccessMessage> {
    const existing = await this.clientItemRepository.findById(id);
    if (!existing) {
      throw new ClientItemNotFoundError();
    }

    await this.findClientById.execute(existing.props.clientId, { onlyActive: true });

    if (data.cnaeNbsIndopId != null) {
      await this.findCnaeNbsIndopById.execute(data.cnaeNbsIndopId);
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
