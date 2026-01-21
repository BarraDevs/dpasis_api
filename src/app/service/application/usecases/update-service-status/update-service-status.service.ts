import { Inject, Injectable } from '@nestjs/common';
import { ServiceNotFoundError } from 'src/app/service/domain/errors/service-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IServiceRepository } from '../../persistence/repository/service-repository.interface';

@Injectable()
export class UpdateServiceStatus {
  constructor(
    @Inject(TOKENS.ServiceRepository) private readonly serviceRepository: IServiceRepository,
  ) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const service = await this.serviceRepository.findById(id);
    if (!service) {
      throw new ServiceNotFoundError();
    }

    service.toggleStatus();
    await this.serviceRepository.edit(service);

    return { message: 'Status atualizado com sucesso.' };
  }
}
