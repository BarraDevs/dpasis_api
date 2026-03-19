import { Inject, Injectable } from '@nestjs/common';
import { NbsDto } from 'src/app/taxation/nbs/application/dtos/nbs.dto';
import { TOKENS } from 'src/core/di/token';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';
import { FindNbsByCnaeForSelectQueryDto } from './dtos/find-nbs-by-cnae-for-select.dto';

@Injectable()
export class FindNbsByCnaeForSelect {
  constructor(
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
  ) {}

  public async execute(queries: FindNbsByCnaeForSelectQueryDto): Promise<NbsDto[]> {
    return this.cnaeNbsIndopDao.findNbssForSelectByCnaeId(queries.cnaeId);
  }
}
