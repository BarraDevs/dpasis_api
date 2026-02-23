import { CnpjLookupOutputDto } from './dtos/cnpj-lookup.dto';

export interface ICnpjLookupGateway {
  lookup(cnpj: string): Promise<CnpjLookupOutputDto>;
}
