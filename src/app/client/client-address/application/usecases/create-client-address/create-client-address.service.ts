import { Inject, Injectable } from '@nestjs/common';
import { ClientAddressAlreadyExistsError } from 'src/app/client/client-address/domain/errors/client-address-already-exists.error';
import { ClientAddressFactory } from 'src/app/client/client-address/domain/factories/client-address.factory';
import { TOKENS } from 'src/core/di/token';
import type { IClientAddressDao } from '../../persistence/dao/client-address-dao.interface';
import type { IClientAddressRepository } from '../../persistence/repository/client-address-repository.interface';
import { CreateClientAddressInputDto, CreateClientAddressOutputDto } from './dtos/create-client-address.dto';

@Injectable()
export class CreateClientAddress {
  constructor(
    @Inject(TOKENS.ClientAddressDao) private readonly clientAddressDao: IClientAddressDao,
    @Inject(TOKENS.ClientAddressRepository) private readonly clientAddressRepository: IClientAddressRepository,
  ) {}

  public async execute(data: CreateClientAddressInputDto): Promise<CreateClientAddressOutputDto> {
    const entity = ClientAddressFactory.create({
      clientId: data.clientId,
      type: data.type,
      zipCode: data.zipCode,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
    });

    const existing = await this.clientAddressDao.findByClientIdAndType(data.clientId, data.type);
    if (existing) {
      throw new ClientAddressAlreadyExistsError(data.clientId, data.type);
    }

    const id = await this.clientAddressRepository.save(entity);

    return { id };
  }
}
