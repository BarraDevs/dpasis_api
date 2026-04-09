import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { hasAnyPositiveReference } from 'src/shared/helpers/has-any-positive-reference';
import { FreightInUseError } from '../../../domain/errors/freight-in-use.error';
import { FreightNotFoundError } from '../../../domain/errors/freight-not-found.error';
import type { IFreightDao } from '../../persistence/dao/freight-dao.interface';

@Injectable()
export class DeleteFreight {
  constructor(
    @Inject(TOKENS.FreightDao) private readonly freightDao: IFreightDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const freight = await this.freightDao.findById(id);
    if (!freight) {
      throw new FreightNotFoundError();
    }

    const inUse = await hasAnyPositiveReference([
      () => this.freightDao.countServicesByFreightId(id),
    ]);
    if (inUse) {
      throw new FreightInUseError();
    }

    await this.freightDao.delete(id);

    return { message: 'Exclusão realizada com sucesso' };
  }
}
