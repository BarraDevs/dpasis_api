import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientItemNotFoundError } from '../../../domain/errors/client-item-not-found.error';
import type { IClientItemRepository } from '../../persistence/repository/client-item-repository.interface';

@Injectable()
export class DeleteClientItem {
  constructor(
    @Inject(TOKENS.ClientItemRepository) private readonly clientItemRepository: IClientItemRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const existing = await this.clientItemRepository.findById(id);
    if (!existing) {
      throw new ClientItemNotFoundError();
    }

    await this.clientItemRepository.delete(id);

    return { message: 'Item do cliente excluído com sucesso' };
  }
}
