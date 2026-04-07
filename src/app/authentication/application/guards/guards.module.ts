/**
 * Agrega guards de autenticação e importa o CASL global ({@link AuthorizationCaslModule}) para que
 * `RolesGuard`, `ClaimsGuard` e `CaslAbilityFactory` existam em qualquer módulo que importe este pacote
 * (ex.: testes de controller e módulos de feature).
 */
import { Module } from '@nestjs/common';
import { AccountModule } from 'src/app/account/account.module';
import { AuthorizationCaslModule } from 'src/app/authentication/infra/authorization/authorization-casl.module';
import { CacheModule } from 'src/infra/cache/cache.module';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { AuthenticationGuard } from './authentication/authentication.guard';

@Module({
  imports: [
    AccountModule,
    AuthorizationCaslModule,
    CacheModule.register(),
    LoggerModule,
  ],
  providers: [
    AuthenticationGuard,
  ],
  exports: [
    AccountModule,
    AuthorizationCaslModule,
    AuthenticationGuard,
  ],
})
export class AuthenticationGuardsModule {}
