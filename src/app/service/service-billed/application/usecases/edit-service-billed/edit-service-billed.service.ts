import { Inject, Injectable } from '@nestjs/common';
import { ServiceBilledNotFoundError } from 'src/app/service/service-billed/domain/errors/service-billed-not-found.error';
import { ServiceBilledFactory } from 'src/app/service/service-billed/domain/factories/service-billed.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IServiceBilledDao } from '../../persistence/dao/service-billed-dao.interface';
import type { IServiceBilledRepository } from '../../persistence/repository/service-billed-repository.interface';
import { EditServiceBilledInputDto } from './dtos/edit-service-billed.dto';

@Injectable()
export class EditServiceBilled {
  constructor(
    @Inject(TOKENS.ServiceBilledDao) private readonly serviceBilledDao: IServiceBilledDao,
    @Inject(TOKENS.ServiceBilledRepository) private readonly serviceBilledRepository: IServiceBilledRepository,
  ) {}

  public async execute(id: number, data: EditServiceBilledInputDto): Promise<SuccessMessage> {
    const existing = await this.serviceBilledDao.findById(id);
    if (!existing) {
      throw new ServiceBilledNotFoundError();
    }

    const entity = ServiceBilledFactory.edit({
      ...existing,
      ...data,
    });

    await this.serviceBilledRepository.edit(entity);

    return { message: 'Edição realizada com sucesso' };
  }
}
