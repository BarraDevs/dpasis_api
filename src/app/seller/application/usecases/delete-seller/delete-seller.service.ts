import { Inject, Injectable } from '@nestjs/common';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ISellerRepository } from '../../persistence/repository/seller-repository.interface';

@Injectable()
export class DeleteSeller {
  constructor(
    @Inject(TOKENS.SellerRepository) private readonly sellerRepository: ISellerRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const seller = await this.sellerRepository.findById(id);
    if (!seller) {
      throw new SellerNotFoundError();
    }

    await this.sellerRepository.delete(id);

    return { message: 'Vendedor excluído com sucesso' };
  }
}
