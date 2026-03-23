import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ServiceWarrantyInUseError } from '../../../domain/errors/service-warranty-in-use.error';
import { ServiceWarrantyNotFoundError } from '../../../domain/errors/service-warranty-not-found.error';
import type { IServiceWarrantyDao } from '../../persistence/dao/service-warranty-dao.interface';

@Injectable()
export class DeleteServiceWarranty {
  constructor(
    @Inject(TOKENS.ServiceWarrantyDao) private readonly serviceWarrantyDao: IServiceWarrantyDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const serviceWarranty = await this.serviceWarrantyDao.findById(id);
    if (!serviceWarranty) {
      throw new ServiceWarrantyNotFoundError();
    }

    const servicesCount = await this.serviceWarrantyDao.countServicesByWarrantyId(id);
    if (servicesCount > 0) {
      throw new ServiceWarrantyInUseError();
    }

    await this.serviceWarrantyDao.delete(id);

    return { message: 'Garantia de serviço excluída com sucesso' };
  }
}
