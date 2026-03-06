import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { CnaeNotFoundError } from '../../../domain/errors/cnae-not-found.error';
import { CnaeDto } from '../../dtos/cnae.dto';
import type { ICnaeDao } from '../../persistence/dao/cnae-dao.interface';

@Injectable()
export class FindCnaeById {
  constructor(
    @Inject(TOKENS.CnaeDao) private readonly cnaeDao: ICnaeDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<CnaeDto> {
    const cnae = await this.cnaeDao.findById(id);
    if (!cnae) {
      throw new CnaeNotFoundError();
    }
    if (options.onlyActive && !cnae.active) {
      throw new CnaeNotFoundError();
    }

    return cnae;
  }
}
