import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { ICepLookupGateway } from 'src/infra/cep-lookup/cep-lookup.gateway';
import { CepLookupOutputDto } from 'src/infra/cep-lookup/dtos/cep-lookup.dto';
import { CepLookupInputDto } from './dtos/cep-lookup.dto';

@Injectable()
export class CepLookup {
  constructor(
    @Inject(TOKENS.CepLookupGateway) private readonly cepLookupGateway: ICepLookupGateway,
  ) {}

  public async execute(data: CepLookupInputDto): Promise<CepLookupOutputDto> {
    return this.cepLookupGateway.lookup(data.zipCode);
  }
}
