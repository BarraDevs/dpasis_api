import { Inject, Injectable } from '@nestjs/common';
import { CnaeDto } from 'src/app/global/taxation/cnae/application/dtos/cnae.dto';
import { TOKENS } from 'src/core/di/token';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';

@Injectable()
export class FindCnaesForSelect {
  constructor(
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
  ) {}

  public async execute(): Promise<CnaeDto[]> {
    return this.cnaeNbsIndopDao.findCnaesForSelect();
  }
}
