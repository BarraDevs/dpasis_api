import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { WarrantyAlreadyExistsError } from '../../../domain/errors/warranty-already-exists.error';
import { WarrantyNotFoundError } from '../../../domain/errors/warranty-not-found.error';
import type { IWarrantyDao } from '../../persistence/dao/warranty-dao.interface';
import { EditWarrantyInputDto } from './dtos/edit-warranty.dto';

@Injectable()
export class EditWarranty {
  constructor(
    @Inject(TOKENS.WarrantyDao) private readonly warrantyDao: IWarrantyDao,
  ) {}

  public async execute(id: number, data: EditWarrantyInputDto): Promise<SuccessMessage> {
    const warranty = await this.warrantyDao.findById(id);
    if (!warranty) {
      throw new WarrantyNotFoundError();
    }

    const existing = await this.warrantyDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new WarrantyAlreadyExistsError(data.name);
    }

    await this.warrantyDao.edit(id, data);

    return { message: 'Edição realizada com sucesso' };
  }
}
