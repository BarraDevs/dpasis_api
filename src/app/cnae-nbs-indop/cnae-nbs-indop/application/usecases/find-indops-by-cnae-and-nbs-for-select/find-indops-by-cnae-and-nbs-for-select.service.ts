import { Inject, Injectable } from '@nestjs/common';
import { IndopDto } from 'src/app/indop/indop/application/dtos/indop.dto';
import type { IIndopDao } from 'src/app/indop/indop/application/persistence/dao/indop-dao.interface';
import { TOKENS } from 'src/core/di/token';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';
import { FindIndopsByCnaeAndNbsForSelectQueryDto } from './dtos/find-indops-by-cnae-and-nbs-for-select.dto';

@Injectable()
export class FindIndopsByCnaeAndNbsForSelect {
  constructor(
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
    @Inject(TOKENS.IndopDao) private readonly indopDao: IIndopDao,
  ) {}

  public async execute(queries: FindIndopsByCnaeAndNbsForSelectQueryDto): Promise<IndopDto[]> {
    const indopIds = await this.cnaeNbsIndopDao.findDistinctIndopIdsByCnaeIdAndNbsId(
      queries.cnaeId,
      queries.nbsId,
    );
    const indops: IndopDto[] = [];

    for (const id of indopIds) {
      const indop = await this.indopDao.findById(id);
      if (indop && indop.active) {
        indops.push(indop);
      }
    }

    return indops.sort((a, b) => a.code.localeCompare(b.code));
  }
}
