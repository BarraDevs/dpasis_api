import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ServiceDeliveryTermNotFoundError } from '../../../domain/errors/service-delivery-term-not-found.error';
import type { IServiceDeliveryTermDao } from '../../persistence/dao/service-delivery-term-dao.interface';

@Injectable()
export class UpdateServiceDeliveryTermStatus {
  constructor(
    @Inject(TOKENS.ServiceDeliveryTermDao) private readonly serviceDeliveryTermDao: IServiceDeliveryTermDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const serviceDeliveryTerm = await this.serviceDeliveryTermDao.findById(id);
    if (!serviceDeliveryTerm) {
      throw new ServiceDeliveryTermNotFoundError();
    }

    await this.serviceDeliveryTermDao.updateStatus(id, !serviceDeliveryTerm.active);

    return { message: 'Status do prazo de entrega atualizado com sucesso' };
  }
}
