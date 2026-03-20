import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ServiceWarrantyNotFoundError } from '../../../domain/errors/service-warranty-not-found.error';
import type { IServiceWarrantyDao } from '../../persistence/dao/service-warranty-dao.interface';

@Injectable()
export class UpdateServiceWarrantyStatus {
  constructor(
    @Inject(TOKENS.ServiceWarrantyDao) private readonly serviceWarrantyDao: IServiceWarrantyDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const serviceWarranty = await this.serviceWarrantyDao.findById(id);
    if (!serviceWarranty) {
      throw new ServiceWarrantyNotFoundError();
    }

    await this.serviceWarrantyDao.updateStatus(id, !serviceWarranty.active);

    return { message: 'Status da garantia de serviço atualizado com sucesso' };
  }
}
