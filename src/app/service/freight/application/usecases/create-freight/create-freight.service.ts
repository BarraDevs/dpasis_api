import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { FreightAlreadyExistsError } from '../../../domain/errors/freight-already-exists.error';
import type { IFreightDao } from '../../persistence/dao/freight-dao.interface';
import { CreateFreightInputDto, CreateFreightOutputDto } from './dtos/create-freight.dto';

@Injectable()
export class CreateFreight {
  constructor(
    @Inject(TOKENS.FreightDao) private readonly freightDao: IFreightDao,
  ) {}

  public async execute(data: CreateFreightInputDto): Promise<CreateFreightOutputDto> {
    const existing = await this.freightDao.findByName(data.name.trim());
    if (existing) {
      throw new FreightAlreadyExistsError(data.name);
    }

    const id = await this.freightDao.save(data);
    return { id };
  }
}
