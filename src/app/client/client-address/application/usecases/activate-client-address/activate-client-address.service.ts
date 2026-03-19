import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientAddressNotFoundError } from '../../../domain/errors/client-address-not-found.error';
import type { IClientAddressRepository } from '../../persistence/repository/client-address-repository.interface';

@Injectable()
export class ActivateClientAddress {
  constructor(
    @Inject(TOKENS.ClientAddressRepository) private readonly clientAddressRepository: IClientAddressRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const address = await this.clientAddressRepository.findById(id);
    if (!address) {
      throw new ClientAddressNotFoundError();
    }

    address.activate();
    await this.clientAddressRepository.edit(address);

    return { message: 'Endereço do cliente ativado com sucesso' };
  }
}
