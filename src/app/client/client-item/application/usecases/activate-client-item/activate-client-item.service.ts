import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientItemNotFoundError } from '../../../domain/errors/client-item-not-found.error';
import type { IClientItemRepository } from '../../persistence/repository/client-item-repository.interface';

@Injectable()
export class ActivateClientItem {
  constructor(
    @Inject(TOKENS.ClientItemRepository) private readonly clientItemRepository: IClientItemRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const item = await this.clientItemRepository.findById(id);
    if (!item) {
      throw new ClientItemNotFoundError();
    }

    item.activate();
    await this.clientItemRepository.edit(item);

    return { message: 'Item do cliente ativado com sucesso' };
  }
}
