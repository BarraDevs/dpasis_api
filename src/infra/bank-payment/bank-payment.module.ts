import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from './adapters/fake/bank-payment-fake.gateway';
import { BankPaymentInterModule } from './adapters/inter/bank-payment-inter.module';
import { BankPaymentInterStrategy } from './adapters/inter/bank-payment-inter.strategy';
import { BankPaymentStrategyAdapterGateway } from './adapters/strategy/bank-payment-strategy.gateway';
import type { IBankPaymentStrategy } from './strategies/bank-payment.strategy';

@Module({})
export class BankPaymentModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    if (isTest) {
      return {
        module: BankPaymentModule,
        providers: [
          {
            provide: TOKENS.BankPaymentGateway,
            useClass: BankPaymentFakeAdapterGateway,
          },
        ],
        exports: [
          TOKENS.BankPaymentGateway,
        ],
      };
    }

    const imports: Type[] = [];
    const strategyInject: Type<IBankPaymentStrategy>[] = [];

    if (process.env.INTER_PROVIDER_ENABLED === 'true') {
      imports.push(BankPaymentInterModule);
      strategyInject.push(BankPaymentInterStrategy);
    }

    const providers: Provider[] = [
      {
        provide: TOKENS.BankPaymentStrategies,
        useFactory: (...strategies: IBankPaymentStrategy[]) => strategies,
        inject: strategyInject,
      },
      {
        provide: TOKENS.BankPaymentGateway,
        useClass: BankPaymentStrategyAdapterGateway,
      },
    ];

    return {
      module: BankPaymentModule,
      imports,
      providers,
      exports: [
        TOKENS.BankPaymentGateway,
      ],
    };
  }
}
