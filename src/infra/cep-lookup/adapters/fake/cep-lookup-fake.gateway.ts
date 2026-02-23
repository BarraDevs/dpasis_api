import { Injectable } from '@nestjs/common';
import { ICepLookupGateway } from '../../cep-lookup.gateway';
import { CepLookupOutputDto } from '../../dtos/cep-lookup.dto';

@Injectable()
export class CepLookupFakeAdapterGateway implements ICepLookupGateway {
  public async lookup(cep: string): Promise<CepLookupOutputDto> {
    return {
      zipCode: cep,
      street: cep,
      complement: null,
      neighborhood: cep,
      city: cep,
      state: cep,
    };
  }
}
