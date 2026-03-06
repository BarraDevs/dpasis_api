import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { NbsAlreadyExistsError } from '../../../domain/errors/nbs-already-exists.error';
import type { INbsDao } from '../../persistence/dao/nbs-dao.interface';
import { CreateNbsInputDto, CreateNbsOutputDto } from './dtos/create-nbs.dto';

@Injectable()
export class CreateNbs {
  constructor(
    @Inject(TOKENS.NbsDao) private readonly nbsDao: INbsDao,
  ) {}

  public async execute(data: CreateNbsInputDto): Promise<CreateNbsOutputDto> {
    const existing = await this.nbsDao.findByCode(data.code.trim());
    if (existing) {
      throw new NbsAlreadyExistsError(data.code);
    }

    const id = await this.nbsDao.save(data);
    return { id };
  }
}
