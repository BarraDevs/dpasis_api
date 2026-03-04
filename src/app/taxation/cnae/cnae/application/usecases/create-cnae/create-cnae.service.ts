import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { CnaeAlreadyExistsError } from '../../../domain/errors/cnae-already-exists.error';
import type { ICnaeDao } from '../../persistence/dao/cnae-dao.interface';
import { CreateCnaeInputDto, CreateCnaeOutputDto } from './dtos/create-cnae.dto';

@Injectable()
export class CreateCnae {
  constructor(
    @Inject(TOKENS.CnaeDao) private readonly cnaeDao: ICnaeDao,
  ) {}

  public async execute(data: CreateCnaeInputDto): Promise<CreateCnaeOutputDto> {
    const existing = await this.cnaeDao.findByCode(data.code.trim());
    if (existing) {
      throw new CnaeAlreadyExistsError(data.code);
    }

    const id = await this.cnaeDao.save(data);
    return { id };
  }
}
