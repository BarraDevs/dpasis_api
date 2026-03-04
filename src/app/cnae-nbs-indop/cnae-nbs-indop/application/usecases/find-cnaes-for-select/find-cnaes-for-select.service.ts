import { Inject, Injectable } from '@nestjs/common';
import { CnaeDto } from 'src/app/cnae/cnae/application/dtos/cnae.dto';
import type { ICnaeDao } from 'src/app/cnae/cnae/application/persistence/dao/cnae-dao.interface';
import { TOKENS } from 'src/core/di/token';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';

@Injectable()
export class FindCnaesForSelect {
  constructor(
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
    @Inject(TOKENS.CnaeDao) private readonly cnaeDao: ICnaeDao,
  ) {}

  public async execute(): Promise<CnaeDto[]> {
    const cnaeIds = await this.cnaeNbsIndopDao.findDistinctCnaeIds();
    const cnaes: CnaeDto[] = [];

    for (const id of cnaeIds) {
      const cnae = await this.cnaeDao.findById(id);
      if (cnae && cnae.active) {
        cnaes.push(cnae);
      }
    }

    return cnaes.sort((a, b) => a.code.localeCompare(b.code));
  }
}
