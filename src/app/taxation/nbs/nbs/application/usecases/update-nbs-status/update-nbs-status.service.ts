import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { NbsNotFoundError } from '../../../domain/errors/nbs-not-found.error';
import type { INbsDao } from '../../persistence/dao/nbs-dao.interface';

@Injectable()
export class UpdateNbsStatus {
  constructor(
    @Inject(TOKENS.NbsDao) private readonly nbsDao: INbsDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const nbs = await this.nbsDao.findById(id);
    if (!nbs) {
      throw new NbsNotFoundError();
    }

    await this.nbsDao.updateStatus(id, !nbs.active);

    return { message: 'Status do NBS atualizado com sucesso' };
  }
}
