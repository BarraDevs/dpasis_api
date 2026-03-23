import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ServiceDeliveryTermInUseError } from '../../../domain/errors/service-delivery-term-in-use.error';
import { ServiceDeliveryTermNotFoundError } from '../../../domain/errors/service-delivery-term-not-found.error';
import type { IServiceDeliveryTermDao } from '../../persistence/dao/service-delivery-term-dao.interface';

@Injectable()
export class DeleteServiceDeliveryTerm {
  constructor(
    @Inject(TOKENS.ServiceDeliveryTermDao) private readonly serviceDeliveryTermDao: IServiceDeliveryTermDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const serviceDeliveryTerm = await this.serviceDeliveryTermDao.findById(id);
    if (!serviceDeliveryTerm) {
      throw new ServiceDeliveryTermNotFoundError();
    }

    const servicesCount = await this.serviceDeliveryTermDao.countServicesByDeliveryTermId(id);
    if (servicesCount > 0) {
      throw new ServiceDeliveryTermInUseError();
    }

    await this.serviceDeliveryTermDao.delete(id);

    return { message: 'Prazo de entrega excluído com sucesso' };
  }
}
