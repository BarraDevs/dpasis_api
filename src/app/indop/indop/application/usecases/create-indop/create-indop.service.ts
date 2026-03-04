import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IndopAlreadyExistsError } from '../../../domain/errors/indop-already-exists.error';
import type { IIndopDao } from '../../persistence/dao/indop-dao.interface';
import { CreateIndopInputDto, CreateIndopOutputDto } from './dtos/create-indop.dto';

@Injectable()
export class CreateIndop {
  constructor(
    @Inject(TOKENS.IndopDao) private readonly indopDao: IIndopDao,
  ) {}

  public async execute(data: CreateIndopInputDto): Promise<CreateIndopOutputDto> {
    const existing = await this.indopDao.findByCode(data.code.trim());
    if (existing) {
      throw new IndopAlreadyExistsError(data.code);
    }

    const id = await this.indopDao.save(data);
    return { id };
  }
}
