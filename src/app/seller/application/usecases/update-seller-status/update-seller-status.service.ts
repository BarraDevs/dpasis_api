import { Inject, Injectable } from '@nestjs/common';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ISellerRepository } from '../../persistence/repository/seller-repository.interface';

@Injectable()
export class UpdateSellerStatus {
  constructor(
    @Inject(TOKENS.SellerRepository) private sellerRepository: ISellerRepository,
  ) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const seller = await this.sellerRepository.findById(id);
    if (!seller) {
      throw new SellerNotFoundError();
    }

    seller.toggleStatus();
    await this.sellerRepository.edit(seller);

    return { message: 'Status atualizado com sucesso.' };
  }
}
