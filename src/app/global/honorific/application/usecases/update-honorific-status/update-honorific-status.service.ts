import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { HonorificNotFoundError } from '../../../domain/errors/honorific-not-found.error';
import type { IHonorificDao } from '../../persistence/dao/honorific-dao.interface';

@Injectable()
export class UpdateHonorificStatus {
  constructor(
    @Inject(TOKENS.HonorificDao) private readonly honorificDao: IHonorificDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const honorific = await this.honorificDao.findById(id);
    if (!honorific) {
      throw new HonorificNotFoundError();
    }

    await this.honorificDao.updateStatus(id, !honorific.active);

    return { message: 'Status do pronome de tratamento atualizado com sucesso' };
  }
}
