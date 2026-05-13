import { Inject, Injectable } from '@nestjs/common';
import { HonorificAlreadyExistsError } from 'src/app/honorific/domain/errors/honorific-already-exists.error';
import { HonorificNotFoundError } from 'src/app/honorific/domain/errors/honorific-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IHonorificDao } from '../../persistence/dao/honorific-dao.interface';
import { EditHonorificInputDto } from './dtos/edit-honorific.dto';

@Injectable()
export class EditHonorific {
  constructor(
    @Inject(TOKENS.HonorificDao) private readonly honorificDao: IHonorificDao,
  ) {}

  public async execute(id: number, data: EditHonorificInputDto): Promise<SuccessMessage> {
    const honorific = await this.honorificDao.findById(id);
    if (!honorific) {
      throw new HonorificNotFoundError();
    }

    if (data.name !== undefined) {
      const name = data.name.trim();
      const existing = await this.honorificDao.findByName(name);
      if (existing && existing.id !== id) {
        throw new HonorificAlreadyExistsError(name);
      }
      await this.honorificDao.edit(id, { ...data, name });
    } else {
      await this.honorificDao.edit(id, data);
    }

    return { message: 'Pronome de tratamento atualizado com sucesso' };
  }
}
