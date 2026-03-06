import { Inject, Injectable } from '@nestjs/common';
import { NbsDto } from 'src/app/taxation/nbs/application/dtos/nbs.dto';
import { FindNbsById } from 'src/app/taxation/nbs/application/usecases/find-nbs-by-id/find-nbs-by-id.service';
import { TOKENS } from 'src/core/di/token';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';
import { FindNbsByCnaeForSelectQueryDto } from './dtos/find-nbs-by-cnae-for-select.dto';

@Injectable()
export class FindNbsByCnaeForSelect {
  constructor(
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
    private readonly findNbsById: FindNbsById,
  ) {}

  public async execute(queries: FindNbsByCnaeForSelectQueryDto): Promise<NbsDto[]> {
    const nbsIds = await this.cnaeNbsIndopDao.findDistinctNbsIdsByCnaeId(queries.cnaeId);
    const nbss: NbsDto[] = [];

    for (const id of nbsIds) {
      try {
        const nbs = await this.findNbsById.execute(id, { onlyActive: true });
        nbss.push(nbs);
      } catch {
        // Skip NBS not found or inactive
      }
    }

    return nbss.sort((a, b) => a.code.localeCompare(b.code));
  }
}
