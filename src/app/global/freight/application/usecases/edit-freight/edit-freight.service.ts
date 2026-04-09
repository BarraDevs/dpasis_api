import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { FreightAlreadyExistsError } from '../../../domain/errors/freight-already-exists.error';
import { FreightNotFoundError } from '../../../domain/errors/freight-not-found.error';
import type { IFreightDao } from '../../persistence/dao/freight-dao.interface';
import { EditFreightInputDto } from './dtos/edit-freight.dto';

@Injectable()
export class EditFreight {
  constructor(
    @Inject(TOKENS.FreightDao) private readonly freightDao: IFreightDao,
  ) {}

  public async execute(id: number, data: EditFreightInputDto): Promise<SuccessMessage> {
    const freight = await this.freightDao.findById(id);
    if (!freight) {
      throw new FreightNotFoundError();
    }

    const existing = await this.freightDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new FreightAlreadyExistsError(data.name);
    }

    await this.freightDao.edit(id, data);

    return { message: 'Edição realizada com sucesso' };
  }
}
