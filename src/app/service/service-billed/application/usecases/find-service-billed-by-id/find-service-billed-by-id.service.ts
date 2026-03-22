import { Inject, Injectable } from '@nestjs/common';
import { ServiceBilledDto } from 'src/app/service/service-billed/application/dtos/service-billed.dto';
import { ServiceBilledNotFoundError } from 'src/app/service/service-billed/domain/errors/service-billed-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import type { IServiceBilledDao } from '../../persistence/dao/service-billed-dao.interface';

@Injectable()
export class FindServiceBilledById {
  constructor(
    @Inject(TOKENS.ServiceBilledDao) private readonly serviceBilledDao: IServiceBilledDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ServiceBilledDto> {
    const result = await this.serviceBilledDao.findById(id);
    if (!result) {
      throw new ServiceBilledNotFoundError();
    }
    if (options.onlyActive && !result.active) {
      throw new ServiceBilledNotFoundError();
    }

    return result;
  }
}
