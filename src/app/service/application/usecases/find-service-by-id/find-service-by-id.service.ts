import { Inject, Injectable } from '@nestjs/common';
import { ServiceNotFoundError } from 'src/app/service/domain/errors/service-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { ServiceDto } from '../../dtos/service.dto';
import type { IServiceDao } from '../../persistence/dao/service-dao.interface';

@Injectable()
export class FindServiceById {
  constructor(
    @Inject(TOKENS.ServiceDao) private readonly serviceDao: IServiceDao,
  ) {}

  public async execute(id: string): Promise<ServiceDto> {
    const service = await this.serviceDao.findById(id);
    if (!service) {
      throw new ServiceNotFoundError();
    }

    return service;
  }
}
