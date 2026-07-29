import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { ICepLookupGateway } from 'src/infra/cep-lookup/cep-lookup.gateway';
import { ClientAddressFactory } from '../../../domain/factories/client-address.factory';
import type { IClientAddressRepository } from '../../persistence/repository/client-address-repository.interface';
import { ProcessResolveClientAddressIbgeCodeInputDto } from './dtos/process-resolve-client-address-ibge-code.dto';

@Injectable()
export class ProcessResolveClientAddressIbgeCode {
  constructor(
    @Inject(TOKENS.CepLookupGateway) private readonly cepLookupGateway: ICepLookupGateway,
    @Inject(TOKENS.ClientAddressRepository) private readonly clientAddressRepository: IClientAddressRepository,
  ) {}

  public async execute(input: ProcessResolveClientAddressIbgeCodeInputDto): Promise<void> {
    const result = await this.cepLookupGateway.lookup(input.zipCode);

    if (!result.cityCodeIbge) {
      return;
    }

    const current = await this.clientAddressRepository.findById(input.clientAddressId);
    if (!current) {
      return;
    }

    if (current.props.zipCode !== input.zipCode) {
      return;
    }

    const edited = ClientAddressFactory.edit({
      ...current.props,
      cityCodeIbge: result.cityCodeIbge,
    });

    await this.clientAddressRepository.edit(edited);
  }
}
