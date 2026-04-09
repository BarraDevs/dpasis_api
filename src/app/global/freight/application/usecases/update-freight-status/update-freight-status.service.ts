import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { FreightNotFoundError } from '../../../domain/errors/freight-not-found.error';
import type { IFreightDao } from '../../persistence/dao/freight-dao.interface';

@Injectable()
export class UpdateFreightStatus {
  constructor(
    @Inject(TOKENS.FreightDao) private readonly freightDao: IFreightDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const freight = await this.freightDao.findById(id);
    if (!freight) {
      throw new FreightNotFoundError();
    }

    await this.freightDao.updateStatus(id, !freight.active);

    return { message: 'Status do frete atualizado com sucesso' };
  }
}
