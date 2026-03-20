import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ServiceWarrantyNotFoundError } from '../../../domain/errors/service-warranty-not-found.error';
import { ServiceWarrantyDto } from '../../dtos/service-warranty.dto';
import type { IServiceWarrantyDao } from '../../persistence/dao/service-warranty-dao.interface';

@Injectable()
export class FindServiceWarrantyById {
  constructor(
    @Inject(TOKENS.ServiceWarrantyDao) private readonly serviceWarrantyDao: IServiceWarrantyDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ServiceWarrantyDto> {
    const serviceWarranty = await this.serviceWarrantyDao.findById(id);
    if (!serviceWarranty) {
      throw new ServiceWarrantyNotFoundError();
    }
    if (options.onlyActive && !serviceWarranty.active) {
      throw new ServiceWarrantyNotFoundError();
    }

    return serviceWarranty;
  }
}
