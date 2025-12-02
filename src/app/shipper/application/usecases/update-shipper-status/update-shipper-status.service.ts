import { Inject, Injectable } from '@nestjs/common';
import { ShipperNotFoundError } from 'src/app/shipper/domain/errors/shipper-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IShipperRepository } from '../../persistence/repository/shipper-repository.interface';

@Injectable()
export class UpdateShipperStatus {
  constructor(
    @Inject(TOKENS.ShipperRepository) private shipperRepository: IShipperRepository,
  ) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const shipper = await this.shipperRepository.findById(id);
    if (!shipper) {
      throw new ShipperNotFoundError();
    }

    shipper.toggleStatus();
    await this.shipperRepository.edit(shipper);

    return { message: 'Status atualizado com sucesso.' };
  }
}
