import { Inject, Injectable } from '@nestjs/common';
import { ProviderItemNotFoundError } from 'src/app/provider/provider-item/domain/errors/provider-item-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IProviderItemRepository } from '../../persistence/repository/provider-item-repository.interface';

@Injectable()
export class DeactivateProviderItem {
  constructor(
    @Inject(TOKENS.ProviderItemRepository) private readonly providerItemRepository: IProviderItemRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const item = await this.providerItemRepository.findById(id);
    if (!item) {
      throw new ProviderItemNotFoundError();
    }

    item.deactivate();
    await this.providerItemRepository.updateStatus(id, false);

    return { message: 'Item do prestador desativado com sucesso' };
  }
}
