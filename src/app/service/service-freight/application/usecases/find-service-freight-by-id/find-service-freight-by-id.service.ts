import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ServiceFreightNotFoundError } from '../../../domain/errors/service-freight-not-found.error';
import { ServiceFreightDto } from '../../dtos/service-freight.dto';
import type { IServiceFreightDao } from '../../persistence/dao/service-freight-dao.interface';

@Injectable()
export class FindServiceFreightById {
  constructor(
    @Inject(TOKENS.ServiceFreightDao) private readonly serviceFreightDao: IServiceFreightDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ServiceFreightDto> {
    const serviceFreight = await this.serviceFreightDao.findById(id);
    if (!serviceFreight) {
      throw new ServiceFreightNotFoundError();
    }
    if (options.onlyActive && !serviceFreight.active) {
      throw new ServiceFreightNotFoundError();
    }

    return serviceFreight;
  }
}
