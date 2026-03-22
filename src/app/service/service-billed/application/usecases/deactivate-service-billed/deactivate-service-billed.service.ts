import { Inject, Injectable } from '@nestjs/common';
import { ServiceBilledNotFoundError } from 'src/app/service/service-billed/domain/errors/service-billed-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IServiceBilledRepository } from '../../persistence/repository/service-billed-repository.interface';

@Injectable()
export class DeactivateServiceBilled {
  constructor(
    @Inject(TOKENS.ServiceBilledRepository) private readonly serviceBilledRepository: IServiceBilledRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const serviceBilled = await this.serviceBilledRepository.findById(id);
    if (!serviceBilled) {
      throw new ServiceBilledNotFoundError();
    }

    serviceBilled.deactivate();
    await this.serviceBilledRepository.edit(serviceBilled);

    return { message: 'Serviço faturado desativado com sucesso' };
  }
}
