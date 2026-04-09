import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { hasAnyPositiveReference } from 'src/shared/helpers/has-any-positive-reference';
import { CnaeInUseError } from '../../../domain/errors/cnae-in-use.error';
import { CnaeNotFoundError } from '../../../domain/errors/cnae-not-found.error';
import type { ICnaeDao } from '../../persistence/dao/cnae-dao.interface';

@Injectable()
export class DeleteCnae {
  constructor(
    @Inject(TOKENS.CnaeDao) private readonly cnaeDao: ICnaeDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const existing = await this.cnaeDao.findById(id);
    if (!existing) {
      throw new CnaeNotFoundError();
    }

    const inUse = await hasAnyPositiveReference([
      () => this.cnaeDao.countCnaeNbsIndopByCnaeId(id),
    ]);
    if (inUse) {
      throw new CnaeInUseError();
    }

    await this.cnaeDao.delete(id);
    return { message: 'CNAE excluído com sucesso.' };
  }
}
