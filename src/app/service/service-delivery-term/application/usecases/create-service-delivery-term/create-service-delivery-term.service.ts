import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ServiceDeliveryTermAlreadyExistsError } from '../../../domain/errors/service-delivery-term-already-exists.error';
import type { IServiceDeliveryTermDao } from '../../persistence/dao/service-delivery-term-dao.interface';
import { CreateServiceDeliveryTermInputDto, CreateServiceDeliveryTermOutputDto } from './dtos/create-service-delivery-term.dto';

@Injectable()
export class CreateServiceDeliveryTerm {
  constructor(
    @Inject(TOKENS.ServiceDeliveryTermDao) private readonly serviceDeliveryTermDao: IServiceDeliveryTermDao,
  ) {}

  public async execute(data: CreateServiceDeliveryTermInputDto): Promise<CreateServiceDeliveryTermOutputDto> {
    const existing = await this.serviceDeliveryTermDao.findByName(data.name.trim());
    if (existing) {
      throw new ServiceDeliveryTermAlreadyExistsError(data.name);
    }

    const id = await this.serviceDeliveryTermDao.save(data);
    return { id };
  }
}
