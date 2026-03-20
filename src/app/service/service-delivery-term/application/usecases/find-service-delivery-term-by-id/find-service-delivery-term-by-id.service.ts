import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ServiceDeliveryTermNotFoundError } from '../../../domain/errors/service-delivery-term-not-found.error';
import { ServiceDeliveryTermDto } from '../../dtos/service-delivery-term.dto';
import type { IServiceDeliveryTermDao } from '../../persistence/dao/service-delivery-term-dao.interface';

@Injectable()
export class FindServiceDeliveryTermById {
  constructor(
    @Inject(TOKENS.ServiceDeliveryTermDao) private readonly serviceDeliveryTermDao: IServiceDeliveryTermDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ServiceDeliveryTermDto> {
    const serviceDeliveryTerm = await this.serviceDeliveryTermDao.findById(id);
    if (!serviceDeliveryTerm) {
      throw new ServiceDeliveryTermNotFoundError();
    }
    if (options.onlyActive && !serviceDeliveryTerm.active) {
      throw new ServiceDeliveryTermNotFoundError();
    }

    return serviceDeliveryTerm;
  }
}
