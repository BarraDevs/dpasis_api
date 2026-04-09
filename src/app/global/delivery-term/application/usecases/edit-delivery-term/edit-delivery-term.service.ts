import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { DeliveryTermAlreadyExistsError } from '../../../domain/errors/delivery-term-already-exists.error';
import { DeliveryTermNotFoundError } from '../../../domain/errors/delivery-term-not-found.error';
import type { IDeliveryTermDao } from '../../persistence/dao/delivery-term-dao.interface';
import { EditDeliveryTermInputDto } from './dtos/edit-delivery-term.dto';

@Injectable()
export class EditDeliveryTerm {
  constructor(
    @Inject(TOKENS.DeliveryTermDao) private readonly deliveryTermDao: IDeliveryTermDao,
  ) {}

  public async execute(id: number, data: EditDeliveryTermInputDto): Promise<SuccessMessage> {
    const deliveryTerm = await this.deliveryTermDao.findById(id);
    if (!deliveryTerm) {
      throw new DeliveryTermNotFoundError();
    }

    const existing = await this.deliveryTermDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new DeliveryTermAlreadyExistsError(data.name);
    }

    await this.deliveryTermDao.edit(id, data);

    return { message: 'Edição realizada com sucesso' };
  }
}
