import { Inject, Injectable } from '@nestjs/common';
import { HonorificAlreadyExistsError } from 'src/app/global/honorific/domain/errors/honorific-already-exists.error';
import { TOKENS } from 'src/core/di/token';
import type { IHonorificDao } from '../../persistence/dao/honorific-dao.interface';
import { CreateHonorificInputDto, CreateHonorificOutputDto } from './dtos/create-honorific.dto';

@Injectable()
export class CreateHonorific {
  constructor(
    @Inject(TOKENS.HonorificDao) private readonly honorificDao: IHonorificDao,
  ) {}

  public async execute(data: CreateHonorificInputDto): Promise<CreateHonorificOutputDto> {
    const name = data.name.trim();
    const existing = await this.honorificDao.findByName(name);
    if (existing) {
      throw new HonorificAlreadyExistsError(name);
    }

    const id = await this.honorificDao.save({ ...data, name });
    return { id };
  }
}
