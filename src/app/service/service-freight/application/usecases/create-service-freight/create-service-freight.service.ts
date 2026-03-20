import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ServiceFreightAlreadyExistsError } from '../../../domain/errors/service-freight-already-exists.error';
import type { IServiceFreightDao } from '../../persistence/dao/service-freight-dao.interface';
import { CreateServiceFreightInputDto, CreateServiceFreightOutputDto } from './dtos/create-service-freight.dto';

@Injectable()
export class CreateServiceFreight {
  constructor(
    @Inject(TOKENS.ServiceFreightDao) private readonly serviceFreightDao: IServiceFreightDao,
  ) {}

  public async execute(data: CreateServiceFreightInputDto): Promise<CreateServiceFreightOutputDto> {
    const existing = await this.serviceFreightDao.findByName(data.name.trim());
    if (existing) {
      throw new ServiceFreightAlreadyExistsError(data.name);
    }

    const id = await this.serviceFreightDao.save(data);
    return { id };
  }
}
