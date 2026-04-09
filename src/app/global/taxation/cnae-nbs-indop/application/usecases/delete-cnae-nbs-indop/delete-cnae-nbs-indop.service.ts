import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { hasAnyPositiveReference } from 'src/shared/helpers/has-any-positive-reference';
import { CnaeNbsIndopInUseError } from '../../../domain/errors/cnae-nbs-indop-in-use.error';
import { CnaeNbsIndopNotFoundError } from '../../../domain/errors/cnae-nbs-indop-not-found.error';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';

@Injectable()
export class DeleteCnaeNbsIndop {
  constructor(
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const existing = await this.cnaeNbsIndopDao.findById(id);
    if (!existing) {
      throw new CnaeNbsIndopNotFoundError();
    }

    const inUse = await hasAnyPositiveReference([
      () => this.cnaeNbsIndopDao.countClientItemsByCnaeNbsIndopId(id),
      () => this.cnaeNbsIndopDao.countServicesByCnaeNbsIndopId(id),
    ]);
    if (inUse) {
      throw new CnaeNbsIndopInUseError();
    }

    await this.cnaeNbsIndopDao.delete(id);
    return { message: 'Combinação excluída com sucesso.' };
  }
}
