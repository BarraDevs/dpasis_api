import { Inject, Injectable } from '@nestjs/common';
import { CnaeDto } from 'src/app/taxation/cnae/cnae/application/dtos/cnae.dto';
import { FindCnaeById } from 'src/app/taxation/cnae/cnae/application/usecases/find-cnae-by-id/find-cnae-by-id.service';
import { TOKENS } from 'src/core/di/token';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';

@Injectable()
export class FindCnaesForSelect {
  constructor(
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
    private readonly findCnaeById: FindCnaeById,
  ) {}

  public async execute(): Promise<CnaeDto[]> {
    const cnaeIds = await this.cnaeNbsIndopDao.findDistinctCnaeIds();
    const cnaes: CnaeDto[] = [];

    for (const id of cnaeIds) {
      try {
        const cnae = await this.findCnaeById.execute(id, { onlyActive: true });
        cnaes.push(cnae);
      } catch {
        // Skip CNAE not found or inactive
      }
    }

    return cnaes.sort((a, b) => a.code.localeCompare(b.code));
  }
}
