import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DeliveryTermAlreadyExistsError } from '../../../domain/errors/delivery-term-already-exists.error';
import type { IDeliveryTermDao } from '../../persistence/dao/delivery-term-dao.interface';
import { CreateDeliveryTermInputDto, CreateDeliveryTermOutputDto } from './dtos/create-delivery-term.dto';

@Injectable()
export class CreateDeliveryTerm {
  constructor(
    @Inject(TOKENS.DeliveryTermDao) private readonly deliveryTermDao: IDeliveryTermDao,
  ) {}

  public async execute(data: CreateDeliveryTermInputDto): Promise<CreateDeliveryTermOutputDto> {
    const existing = await this.deliveryTermDao.findByName(data.name.trim());
    if (existing) {
      throw new DeliveryTermAlreadyExistsError(data.name);
    }

    const id = await this.deliveryTermDao.save(data);
    return { id };
  }
}
