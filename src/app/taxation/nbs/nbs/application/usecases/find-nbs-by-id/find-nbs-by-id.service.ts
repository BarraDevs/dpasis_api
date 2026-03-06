import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { NbsNotFoundError } from '../../../domain/errors/nbs-not-found.error';
import { NbsDto } from '../../dtos/nbs.dto';
import type { INbsDao } from '../../persistence/dao/nbs-dao.interface';

@Injectable()
export class FindNbsById {
  constructor(
    @Inject(TOKENS.NbsDao) private readonly nbsDao: INbsDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<NbsDto> {
    const nbs = await this.nbsDao.findById(id);
    if (!nbs) {
      throw new NbsNotFoundError();
    }
    if (options.onlyActive && !nbs.active) {
      throw new NbsNotFoundError();
    }

    return nbs;
  }
}
