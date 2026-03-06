import { Inject, Injectable } from '@nestjs/common';
import { ClientDiscountDto } from 'src/app/client/client-discount/application/dtos/client-discount.dto';
import { ClientDiscountNotFoundError } from 'src/app/client/client-discount/domain/errors/client-discount-not-found.error';
import { TOKENS } from 'src/core/di/token';
import type { IClientDiscountDao } from '../../persistence/dao/client-discount-dao.interface';

@Injectable()
export class FindClientDiscountById {
  constructor(
    @Inject(TOKENS.ClientDiscountDao) private readonly clientDiscountDao: IClientDiscountDao,
  ) {}

  public async execute(id: number): Promise<ClientDiscountDto> {
    const result = await this.clientDiscountDao.findById(id);
    if (!result) {
      throw new ClientDiscountNotFoundError();
    }

    return result;
  }
}
