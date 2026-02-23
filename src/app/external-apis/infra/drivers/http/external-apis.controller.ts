import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CepLookup } from 'src/app/external-apis/application/usecases/cep-lookup/cep-lookup.service';
import { CepLookupInputDto } from 'src/app/external-apis/application/usecases/cep-lookup/dtos/cep-lookup.dto';
import { CnpjLookup } from 'src/app/external-apis/application/usecases/cnpj-lookup/cnpj-lookup.service';
import { CnpjLookupInputDto } from 'src/app/external-apis/application/usecases/cnpj-lookup/dtos/cnpj-lookup.dto';
import { CepLookupOutputDto } from 'src/infra/cep-lookup/dtos/cep-lookup.dto';
import { CnpjLookupOutputDto } from 'src/infra/cnpj-lookup/dtos/cnpj-lookup.dto';
import { Swagger } from 'src/infra/openapi/swagger';

@Controller('external-apis')
export class ExternalApisController {
  constructor(
    private readonly cepLookup: CepLookup,
    private readonly cnpjLookup: CnpjLookup,
  ) {}

  @Post('cep')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    tags: ['APIs Externas'],
    summary: 'Buscar CEP',
    applyBadRequest: true,
    applyServiceUnavailable: true,
    okResponse: CepLookupOutputDto,
  })
  public lookupCep(@Body() body: CepLookupInputDto): Promise<CepLookupOutputDto> {
    return this.cepLookup.execute(body);
  }

  @Post('cnpj')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    tags: ['APIs Externas'],
    summary: 'Buscar CNPJ',
    applyBadRequest: true,
    applyServiceUnavailable: true,
    okResponse: CnpjLookupOutputDto,
  })
  public lookupCnpj(@Body() body: CnpjLookupInputDto): Promise<CnpjLookupOutputDto> {
    return this.cnpjLookup.execute(body);
  }
}
