import { Inject, Injectable } from '@nestjs/common';
import { ServiceBilledFactory } from 'src/app/service/service-billed/domain/factories/service-billed.factory';
import { TOKENS } from 'src/core/di/token';
import type { IServiceBilledRepository } from '../../persistence/repository/service-billed-repository.interface';
import { CreateServiceBilledInputDto, CreateServiceBilledOutputDto } from './dtos/create-service-billed.dto';

@Injectable()
export class CreateServiceBilled {
  constructor(
    @Inject(TOKENS.ServiceBilledRepository) private readonly serviceBilledRepository: IServiceBilledRepository,
  ) {}

  public async execute(data: CreateServiceBilledInputDto): Promise<CreateServiceBilledOutputDto> {
    const entity = ServiceBilledFactory.create(data);

    const id = await this.serviceBilledRepository.save(entity);

    return { id };
  }
}
