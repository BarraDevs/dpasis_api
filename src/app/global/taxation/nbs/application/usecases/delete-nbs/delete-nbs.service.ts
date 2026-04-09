import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { hasAnyPositiveReference } from 'src/shared/helpers/has-any-positive-reference';
import { NbsInUseError } from '../../../domain/errors/nbs-in-use.error';
import { NbsNotFoundError } from '../../../domain/errors/nbs-not-found.error';
import type { INbsDao } from '../../persistence/dao/nbs-dao.interface';

@Injectable()
export class DeleteNbs {
  constructor(
    @Inject(TOKENS.NbsDao) private readonly nbsDao: INbsDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const existing = await this.nbsDao.findById(id);
    if (!existing) {
      throw new NbsNotFoundError();
    }

    const inUse = await hasAnyPositiveReference([
      () => this.nbsDao.countCnaeNbsIndopByNbsId(id),
    ]);
    if (inUse) {
      throw new NbsInUseError();
    }

    await this.nbsDao.delete(id);
    return { message: 'NBS excluído com sucesso.' };
  }
}
