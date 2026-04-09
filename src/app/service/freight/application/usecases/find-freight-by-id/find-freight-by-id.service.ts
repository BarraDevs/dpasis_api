import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { FreightNotFoundError } from '../../../domain/errors/freight-not-found.error';
import { FreightDto } from '../../dtos/freight.dto';
import type { IFreightDao } from '../../persistence/dao/freight-dao.interface';

@Injectable()
export class FindFreightById {
  constructor(
    @Inject(TOKENS.FreightDao) private readonly freightDao: IFreightDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<FreightDto> {
    const freight = await this.freightDao.findById(id);
    if (!freight) {
      throw new FreightNotFoundError();
    }
    if (options.onlyActive && !freight.active) {
      throw new FreightNotFoundError();
    }

    return freight;
  }
}
