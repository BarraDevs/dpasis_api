import { Inject, Injectable } from '@nestjs/common';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { TOKENS } from 'src/core/di/token';
import { ClientAddressNotFoundError } from '../../../domain/errors/client-address-not-found.error';
import type { IClientAddressRepository } from '../../persistence/repository/client-address-repository.interface';
import type { IClientAddressQueueProducer } from '../../queue/client-address-queue-producer.interface';
import { EditClientAddressInputDto } from './dtos/edit-client-address.dto';
import { ClientAddressFactory } from '../../../domain/factories/client-address.factory';

@Injectable()
export class EditClientAddress {
  constructor(
    @Inject(TOKENS.ClientAddressRepository) private readonly clientAddressRepository: IClientAddressRepository,
    @Inject(TOKENS.ClientAddressQueueProducer) private readonly clientAddressQueueProducer: IClientAddressQueueProducer,
  ) {}

  public async execute(id: number, data: EditClientAddressInputDto): Promise<SuccessMessage> {
    const clientAddress = await this.clientAddressRepository.findById(id);
    if (!clientAddress) {
      throw new ClientAddressNotFoundError();
    }

    const clientAddressEntity = ClientAddressFactory.edit({
      ...clientAddress.props,
      ...data,
    });

    await this.clientAddressRepository.edit(clientAddressEntity);

    if (!clientAddressEntity.props.cityCodeIbge) {
      await this.clientAddressQueueProducer.addResolveIbgeCodeJob({
        clientAddressId: id,
        zipCode: clientAddressEntity.props.zipCode,
      });
    }

    return { message: 'Edição realizada com sucesso' };
  }
}
