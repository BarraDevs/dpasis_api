import { Inject, Injectable } from '@nestjs/common';
import { IndopDto } from 'src/app/taxation/indop/application/dtos/indop.dto';
import { TOKENS } from 'src/core/di/token';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';
import { FindIndopsByCnaeAndNbsForSelectQueryDto } from './dtos/find-indops-by-cnae-and-nbs-for-select.dto';

@Injectable()
export class FindIndopsByCnaeAndNbsForSelect {
  constructor(
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
  ) {}

  public async execute(queries: FindIndopsByCnaeAndNbsForSelectQueryDto): Promise<IndopDto[]> {
    return this.cnaeNbsIndopDao.findIndopsForSelectByCnaeAndNbs(
      queries.cnaeId,
      queries.nbsId,
    );
  }
}
