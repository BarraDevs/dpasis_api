import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { CnaeNbsIndopNotFoundError } from '../../../domain/errors/cnae-nbs-indop-not-found.error';
import { CnaeNbsIndopDto } from '../../dtos/cnae-nbs-indop.dto';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';

@Injectable()
export class FindCnaeNbsIndopById {
  constructor(
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<CnaeNbsIndopDto> {
    const result = await this.cnaeNbsIndopDao.findById(id);
    if (!result) {
      throw new CnaeNbsIndopNotFoundError();
    }
    if (options.onlyActive && !result.active) {
      throw new CnaeNbsIndopNotFoundError();
    }

    return result;
  }
}
