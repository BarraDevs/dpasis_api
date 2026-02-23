import { Module } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';
import { CepLookupModule } from './cep-lookup/cep-lookup.module';
import { CnpjLookupModule } from './cnpj-lookup/cnpj-lookup.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    CacheModule.register(),
    CepLookupModule.register(),
    CnpjLookupModule.register(),
    DatabaseModule,
    LoggerModule,
  ],
})
export class InfraModule {}
