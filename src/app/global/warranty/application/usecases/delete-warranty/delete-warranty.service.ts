import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { hasAnyPositiveReference } from 'src/shared/helpers/has-any-positive-reference';
import { WarrantyInUseError } from '../../../domain/errors/warranty-in-use.error';
import { WarrantyNotFoundError } from '../../../domain/errors/warranty-not-found.error';
import type { IWarrantyDao } from '../../persistence/dao/warranty-dao.interface';

@Injectable()
export class DeleteWarranty {
  constructor(
    @Inject(TOKENS.WarrantyDao) private readonly warrantyDao: IWarrantyDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const warranty = await this.warrantyDao.findById(id);
    if (!warranty) {
      throw new WarrantyNotFoundError();
    }

    const inUse = await hasAnyPositiveReference([
      () => this.warrantyDao.countServicesByWarrantyId(id),
    ]);
    if (inUse) {
      throw new WarrantyInUseError();
    }

    await this.warrantyDao.delete(id);

    return { message: 'Exclusão realizada com sucesso' };
  }
}
