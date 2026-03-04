import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { NbsAlreadyExistsError } from '../../../domain/errors/nbs-already-exists.error';
import { NbsNotFoundError } from '../../../domain/errors/nbs-not-found.error';
import type { INbsDao } from '../../persistence/dao/nbs-dao.interface';
import { EditNbsInputDto } from './dtos/edit-nbs.dto';

@Injectable()
export class EditNbs {
  constructor(
    @Inject(TOKENS.NbsDao) private readonly nbsDao: INbsDao,
  ) {}

  public async execute(id: number, data: EditNbsInputDto): Promise<SuccessMessage> {
    const nbs = await this.nbsDao.findById(id);
    if (!nbs) {
      throw new NbsNotFoundError();
    }

    const existing = await this.nbsDao.findByCode(data.code.trim());
    if (existing && existing.id !== id) {
      throw new NbsAlreadyExistsError(data.code);
    }

    await this.nbsDao.edit(id, data);

    return { message: 'NBS atualizado com sucesso' };
  }
}
