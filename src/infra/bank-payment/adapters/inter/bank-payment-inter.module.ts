import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { BankPaymentInterStrategy } from './bank-payment-inter.strategy';
import { InterOauthClient } from './oauth/inter-oauth.client';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [InterOauthClient, BankPaymentInterStrategy],
  exports: [BankPaymentInterStrategy],
})
export class BankPaymentInterModule {}
