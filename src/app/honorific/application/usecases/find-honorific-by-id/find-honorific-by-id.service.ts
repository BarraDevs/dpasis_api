import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { HonorificNotFoundError } from '../../../domain/errors/honorific-not-found.error';
import { HonorificDto } from '../../dtos/honorific.dto';
import type { IHonorificDao } from '../../persistence/dao/honorific-dao.interface';

@Injectable()
export class FindHonorificById {
  constructor(
    @Inject(TOKENS.HonorificDao) private readonly honorificDao: IHonorificDao,
  ) {}

  public async execute(id: number): Promise<HonorificDto> {
    const honorific = await this.honorificDao.findById(id);
    if (!honorific) {
      throw new HonorificNotFoundError();
    }

    return honorific;
  }
}
