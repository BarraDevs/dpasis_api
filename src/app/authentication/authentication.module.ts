import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AccountModule } from '../account/account.module';
import { AuthenticationGuardsModule } from './application/guards/guards.module';
import { SignInWithCredentialAndPassword } from './application/usecases/signin-with-credential-and-password/signin-with-credential-and-password.service';
import { AuthenticationController } from './infra/drivers/http/authentication.controller';
import { JwtAuthModule } from './infra/strategies/jwt/jwt.module';

@Module({
  imports: [
    JwtAuthModule,
    PassportModule,
    AccountModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    AuthenticationController,
  ],
  providers: [
    SignInWithCredentialAndPassword,
  ],
})
export class AuthenticationModule {}
