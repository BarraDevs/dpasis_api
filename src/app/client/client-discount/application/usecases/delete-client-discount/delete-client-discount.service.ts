import { Inject, Injectable } from '@nestjs/common';
import { ClientDiscountNotFoundError } from 'src/app/client/client-discount/domain/errors/client-discount-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IClientDiscountDao } from '../../persistence/dao/client-discount-dao.interface';
import type { IClientDiscountRepository } from '../../persistence/repository/client-discount-repository.interface';

@Injectable()
export class DeleteClientDiscount {
  constructor(
    @Inject(TOKENS.ClientDiscountDao) private readonly clientDiscountDao: IClientDiscountDao,
    @Inject(TOKENS.ClientDiscountRepository) private readonly clientDiscountRepository: IClientDiscountRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const existing = await this.clientDiscountDao.findById(id);
    if (!existing) {
      throw new ClientDiscountNotFoundError();
    }

    await this.clientDiscountRepository.delete(id);

    return { message: 'Exclusão realizada com sucesso' };
  }
}
