import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { WarrantyNotFoundError } from '../../../domain/errors/warranty-not-found.error';
import type { IWarrantyDao } from '../../persistence/dao/warranty-dao.interface';

@Injectable()
export class UpdateWarrantyStatus {
  constructor(
    @Inject(TOKENS.WarrantyDao) private readonly warrantyDao: IWarrantyDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const warranty = await this.warrantyDao.findById(id);
    if (!warranty) {
      throw new WarrantyNotFoundError();
    }

    await this.warrantyDao.updateStatus(id, !warranty.active);

    return { message: 'Status da garantia atualizado com sucesso' };
  }
}
