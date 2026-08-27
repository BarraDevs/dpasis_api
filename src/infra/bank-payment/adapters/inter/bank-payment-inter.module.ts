import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { BankPaymentInterStrategy } from './bank-payment-inter.strategy';
import { InterCobrancaClient } from './cobranca/inter-cobranca.client';
import { InterOauthClient } from './oauth/inter-oauth.client';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
  ],
  providers: [
    InterOauthClient,
    InterCobrancaClient,
    BankPaymentInterStrategy,
  ],
  exports: [
    BankPaymentInterStrategy,
  ],
})
export class BankPaymentInterModule {}
