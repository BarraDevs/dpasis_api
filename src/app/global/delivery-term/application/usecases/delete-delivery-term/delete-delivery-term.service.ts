import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { DeliveryTermInUseError } from '../../../domain/errors/delivery-term-in-use.error';
import { DeliveryTermNotFoundError } from '../../../domain/errors/delivery-term-not-found.error';
import type { IDeliveryTermDao } from '../../persistence/dao/delivery-term-dao.interface';

@Injectable()
export class DeleteDeliveryTerm {
  constructor(
    @Inject(TOKENS.DeliveryTermDao) private readonly deliveryTermDao: IDeliveryTermDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const deliveryTerm = await this.deliveryTermDao.findById(id);
    if (!deliveryTerm) {
      throw new DeliveryTermNotFoundError();
    }

    const servicesCount = await this.deliveryTermDao.countServicesByDeliveryTermId(id);
    if (servicesCount > 0) {
      throw new DeliveryTermInUseError();
    }

    await this.deliveryTermDao.delete(id);

    return { message: 'Exclusão realizada com sucesso' };
  }
}
