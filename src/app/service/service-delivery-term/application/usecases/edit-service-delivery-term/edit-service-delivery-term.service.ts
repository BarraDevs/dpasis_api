import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ServiceDeliveryTermAlreadyExistsError } from '../../../domain/errors/service-delivery-term-already-exists.error';
import { ServiceDeliveryTermNotFoundError } from '../../../domain/errors/service-delivery-term-not-found.error';
import type { IServiceDeliveryTermDao } from '../../persistence/dao/service-delivery-term-dao.interface';
import { EditServiceDeliveryTermInputDto } from './dtos/edit-service-delivery-term.dto';

@Injectable()
export class EditServiceDeliveryTerm {
  constructor(
    @Inject(TOKENS.ServiceDeliveryTermDao) private readonly serviceDeliveryTermDao: IServiceDeliveryTermDao,
  ) {}

  public async execute(id: number, data: EditServiceDeliveryTermInputDto): Promise<SuccessMessage> {
    const serviceDeliveryTerm = await this.serviceDeliveryTermDao.findById(id);
    if (!serviceDeliveryTerm) {
      throw new ServiceDeliveryTermNotFoundError();
    }

    const existing = await this.serviceDeliveryTermDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ServiceDeliveryTermAlreadyExistsError(data.name);
    }

    await this.serviceDeliveryTermDao.edit(id, data);

    return { message: 'Prazo de entrega atualizado com sucesso' };
  }
}
