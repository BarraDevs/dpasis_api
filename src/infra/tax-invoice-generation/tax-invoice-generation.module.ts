import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { TaxInvoiceGenerationFakeAdapterGateway } from './adapters/fake/tax-invoice-generation-fake.gateway';
import { TaxInvoiceGenerationNfemailAdapterGateway } from './adapters/nfemail/tax-invoice-generation-nfemail.gateway';

@Module({})
export class TaxInvoiceGenerationModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: TaxInvoiceGenerationModule,
      imports: [
        ConfigModule,
        HttpModule,
      ],
      providers: [
        {
          provide: TOKENS.TaxInvoiceGenerationGateway,
          useClass: isTest ? TaxInvoiceGenerationFakeAdapterGateway : TaxInvoiceGenerationNfemailAdapterGateway,
        },
      ],
      exports: [
        TOKENS.TaxInvoiceGenerationGateway,
      ],
    };
  }
}
