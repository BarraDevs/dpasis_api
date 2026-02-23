import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { ICnpjLookupGateway } from 'src/infra/cnpj-lookup/cnpj-lookup.gateway';
import { CnpjLookupOutputDto } from 'src/infra/cnpj-lookup/dtos/cnpj-lookup.dto';
import { CnpjLookupInputDto } from './dtos/cnpj-lookup.dto';

@Injectable()
export class CnpjLookup {
  constructor(
    @Inject(TOKENS.CnpjLookupGateway) private readonly cnpjLookupGateway: ICnpjLookupGateway,
  ) {}

  public async execute(data: CnpjLookupInputDto): Promise<CnpjLookupOutputDto> {
    return this.cnpjLookupGateway.lookup(data.cnpj);
  }
}
