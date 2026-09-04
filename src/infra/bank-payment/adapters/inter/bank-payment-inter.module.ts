import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { ProviderAttemptModule } from 'src/infra/provider-attempt/provider-attempt.module';
import { BankPaymentInterStrategy } from './bank-payment-inter.strategy';
import { InterCobrancaClient } from './cobranca/inter-cobranca.client';
import { InterOauthClient } from './oauth/inter-oauth.client';

/** A API do Inter responde rápido; 30s é folga para pico, não para conexão pendurada. */
const HTTP_TIMEOUT_MS = 30_000;

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({ timeout: HTTP_TIMEOUT_MS }),
    ProviderAttemptModule,
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
