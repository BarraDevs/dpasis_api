import { DynamicModule, Module, Provider } from '@nestjs/common';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { BankSlipGenerationFakeAdapterGateway } from './adapters/fake/bank-slip-generation-fake.gateway';
import { BankSlipGenerationInterStrategy } from './adapters/inter/bank-slip-generation-inter.strategy';
import { BankSlipGenerationStrategyAdapterGateway } from './adapters/strategy/bank-slip-generation-strategy.gateway';

@Module({})
export class BankSlipGenerationModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    const providers: Provider[] = isTest
      ? [
        {
          provide: TOKENS.BankSlipGenerationGateway,
          useClass: BankSlipGenerationFakeAdapterGateway,
        },
      ]
      : [
        BankSlipGenerationInterStrategy,
        {
          provide: TOKENS.BankSlipGenerationStrategies,
          useFactory: (inter: BankSlipGenerationInterStrategy) => [inter],
          inject: [BankSlipGenerationInterStrategy],
        },
        {
          provide: TOKENS.BankSlipGenerationGateway,
          useClass: BankSlipGenerationStrategyAdapterGateway,
        },
      ];

    return {
      module: BankSlipGenerationModule,
      providers,
      exports: [
        TOKENS.BankSlipGenerationGateway,
      ],
    };
  }
}
