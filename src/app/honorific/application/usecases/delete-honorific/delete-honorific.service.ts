import { Inject, Injectable } from '@nestjs/common';
import { HonorificNotFoundError } from 'src/app/honorific/domain/errors/honorific-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IHonorificDao } from '../../persistence/dao/honorific-dao.interface';

@Injectable()
export class DeleteHonorific {
  constructor(
    @Inject(TOKENS.HonorificDao) private readonly honorificDao: IHonorificDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const honorific = await this.honorificDao.findById(id);
    if (!honorific) {
      throw new HonorificNotFoundError();
    }

    await this.honorificDao.delete(id);

    return { message: 'Pronome de tratamento excluído com sucesso' };
  }
}
