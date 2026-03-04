import { Inject, Injectable } from '@nestjs/common';
import { NbsDto } from 'src/app/nbs/nbs/application/dtos/nbs.dto';
import type { INbsDao } from 'src/app/nbs/nbs/application/persistence/dao/nbs-dao.interface';
import { TOKENS } from 'src/core/di/token';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';
import { FindNbsByCnaeForSelectQueryDto } from './dtos/find-nbs-by-cnae-for-select.dto';

@Injectable()
export class FindNbsByCnaeForSelect {
  constructor(
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
    @Inject(TOKENS.NbsDao) private readonly nbsDao: INbsDao,
  ) {}

  public async execute(queries: FindNbsByCnaeForSelectQueryDto): Promise<NbsDto[]> {
    const nbsIds = await this.cnaeNbsIndopDao.findDistinctNbsIdsByCnaeId(queries.cnaeId);
    const nbss: NbsDto[] = [];

    for (const id of nbsIds) {
      const nbs = await this.nbsDao.findById(id);
      if (nbs && nbs.active) {
        nbss.push(nbs);
      }
    }

    return nbss.sort((a, b) => a.code.localeCompare(b.code));
  }
}
