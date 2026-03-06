import { Inject, Injectable } from '@nestjs/common';
import { IndopDto } from 'src/app/taxation/indop/indop/application/dtos/indop.dto';
import { FindIndopById } from 'src/app/taxation/indop/indop/application/usecases/find-indop-by-id/find-indop-by-id.service';
import { TOKENS } from 'src/core/di/token';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';
import { FindIndopsByCnaeAndNbsForSelectQueryDto } from './dtos/find-indops-by-cnae-and-nbs-for-select.dto';

@Injectable()
export class FindIndopsByCnaeAndNbsForSelect {
  constructor(
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
    private readonly findIndopById: FindIndopById,
  ) {}

  public async execute(queries: FindIndopsByCnaeAndNbsForSelectQueryDto): Promise<IndopDto[]> {
    const indopIds = await this.cnaeNbsIndopDao.findDistinctIndopIdsByCnaeIdAndNbsId(
      queries.cnaeId,
      queries.nbsId,
    );
    const indops: IndopDto[] = [];

    for (const id of indopIds) {
      try {
        const indop = await this.findIndopById.execute(id, { onlyActive: true });
        indops.push(indop);
      } catch {
        // Skip INDOP not found or inactive
      }
    }

    return indops.sort((a, b) => a.code.localeCompare(b.code));
  }
}
