import { Inject, Injectable } from '@nestjs/common';
import { ClientDiscountNotFoundError } from 'src/app/client/client-discount/domain/errors/client-discount-not-found.error';
import { ClientDiscountFactory } from 'src/app/client/client-discount/domain/factories/client-discount.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IClientDiscountDao } from '../../persistence/dao/client-discount-dao.interface';
import type { IClientDiscountRepository } from '../../persistence/repository/client-discount-repository.interface';
import { EditClientDiscountInputDto } from './dtos/edit-client-discount.dto';

@Injectable()
export class EditClientDiscount {
  constructor(
    @Inject(TOKENS.ClientDiscountDao) private readonly clientDiscountDao: IClientDiscountDao,
    @Inject(TOKENS.ClientDiscountRepository) private readonly clientDiscountRepository: IClientDiscountRepository,
  ) {}

  public async execute(id: number, data: EditClientDiscountInputDto): Promise<SuccessMessage> {
    const existing = await this.clientDiscountDao.findById(id);
    if (!existing) {
      throw new ClientDiscountNotFoundError();
    }

    const entity = ClientDiscountFactory.edit({
      ...existing,
      ...data,
    });

    await this.clientDiscountRepository.edit(entity);

    return { message: 'Edição realizada com sucesso' };
  }
}
