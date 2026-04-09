import { Inject, Injectable } from '@nestjs/common';
import { BilledDto } from 'src/app/global/billed/application/dtos/billed.dto';
import { BilledNotFoundError } from 'src/app/global/billed/domain/errors/billed-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import type { IBilledDao } from '../../persistence/dao/billed-dao.interface';

@Injectable()
export class FindBilledById {
  constructor(
    @Inject(TOKENS.BilledDao) private readonly billedDao: IBilledDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<BilledDto> {
    const result = await this.billedDao.findById(id);
    if (!result) {
      throw new BilledNotFoundError();
    }
    if (options.onlyActive && !result.active) {
      throw new BilledNotFoundError();
    }

    return result;
  }
}
