import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ServiceWarrantyAlreadyExistsError } from '../../../domain/errors/service-warranty-already-exists.error';
import type { IServiceWarrantyDao } from '../../persistence/dao/service-warranty-dao.interface';
import { CreateServiceWarrantyInputDto, CreateServiceWarrantyOutputDto } from './dtos/create-service-warranty.dto';

@Injectable()
export class CreateServiceWarranty {
  constructor(
    @Inject(TOKENS.ServiceWarrantyDao) private readonly serviceWarrantyDao: IServiceWarrantyDao,
  ) {}

  public async execute(data: CreateServiceWarrantyInputDto): Promise<CreateServiceWarrantyOutputDto> {
    const existing = await this.serviceWarrantyDao.findByName(data.name.trim());
    if (existing) {
      throw new ServiceWarrantyAlreadyExistsError(data.name);
    }

    const id = await this.serviceWarrantyDao.save(data);
    return { id };
  }
}
