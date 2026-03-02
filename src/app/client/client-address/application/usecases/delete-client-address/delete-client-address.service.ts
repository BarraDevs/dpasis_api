import { Inject, Injectable } from '@nestjs/common';
import { ClientMainAddressCannotBeDeletedError } from 'src/app/client/client-address/domain/errors/client-main-address-cannot-be-deleted.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientAddressNotFoundError } from '../../../domain/errors/client-address-not-found.error';
import type { IClientAddressRepository } from '../../persistence/repository/client-address-repository.interface';

@Injectable()
export class DeleteClientAddress {
  constructor(
    @Inject(TOKENS.ClientAddressRepository) private readonly clientAddressRepository: IClientAddressRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientAddress = await this.clientAddressRepository.findById(id);
    if (!clientAddress) {
      throw new ClientAddressNotFoundError();
    }
    if (clientAddress.isMain()) {
      throw new ClientMainAddressCannotBeDeletedError();
    }

    await this.clientAddressRepository.delete(id);

    return { message: 'Exclusão realizada com sucesso' };
  }
}
