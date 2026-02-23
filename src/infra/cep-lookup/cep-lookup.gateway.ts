import { CepLookupOutputDto } from './dtos/cep-lookup.dto';

export interface ICepLookupGateway {
  lookup(cep: string): Promise<CepLookupOutputDto>;
}
