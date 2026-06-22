import { Inject, Injectable } from '@nestjs/common';
import { CarrierNotFoundError } from 'src/app/carrier/domain/errors/carrier-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ICarrierRepository } from '../../persistence/repository/carrier-repository.interface';

@Injectable()
export class DeactivateCarrier {
  constructor(
    @Inject(TOKENS.CarrierRepository) private readonly carrierRepository: ICarrierRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const carrier = await this.carrierRepository.findById(id);
    if (!carrier) {
      throw new CarrierNotFoundError();
    }

    carrier.deactivate();
    await this.carrierRepository.edit(carrier);

    return { message: 'Transportadora desativada com sucesso' };
  }
}
