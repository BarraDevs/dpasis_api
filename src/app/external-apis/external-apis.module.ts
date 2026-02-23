import { Module } from '@nestjs/common';
import { CepLookupModule } from 'src/infra/cep-lookup/cep-lookup.module';
import { CnpjLookupModule } from 'src/infra/cnpj-lookup/cnpj-lookup.module';
import { CepLookup } from './application/usecases/cep-lookup/cep-lookup.service';
import { CnpjLookup } from './application/usecases/cnpj-lookup/cnpj-lookup.service';
import { ExternalApisController } from './infra/drivers/http/external-apis.controller';

@Module({
  imports: [
    CepLookupModule.register(),
    CnpjLookupModule.register(),
  ],
  controllers: [
    ExternalApisController,
  ],
  providers: [
    CepLookup,
    CnpjLookup,
  ],
  exports: [],
})
export class ExternalApisModule {}
