import { Injectable } from '@nestjs/common';
import { ICnpjLookupGateway } from '../../cnpj-lookup.gateway';
import { CnpjLookupOutputDto } from '../../dtos/cnpj-lookup.dto';

@Injectable()
export class CnpjLookupFakeAdapterGateway implements ICnpjLookupGateway {
  public async lookup(cnpj: string): Promise<CnpjLookupOutputDto> {
    return {
      fantasyName: cnpj,
      companyName: cnpj,
      address: {
        zipCode: cnpj,
        street: cnpj,
        number: cnpj,
        complement: null,
        neighborhood: cnpj,
        city: cnpj,
        state: cnpj,
      },
    };
  }
}
