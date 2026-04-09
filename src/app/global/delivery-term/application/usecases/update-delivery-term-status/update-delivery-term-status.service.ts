import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { DeliveryTermNotFoundError } from '../../../domain/errors/delivery-term-not-found.error';
import type { IDeliveryTermDao } from '../../persistence/dao/delivery-term-dao.interface';

@Injectable()
export class UpdateDeliveryTermStatus {
  constructor(
    @Inject(TOKENS.DeliveryTermDao) private readonly deliveryTermDao: IDeliveryTermDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const deliveryTerm = await this.deliveryTermDao.findById(id);
    if (!deliveryTerm) {
      throw new DeliveryTermNotFoundError();
    }

    await this.deliveryTermDao.updateStatus(id, !deliveryTerm.active);

    return { message: 'Status do prazo de entrega atualizado com sucesso' };
  }
}
