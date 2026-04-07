/**
 * Módulo global de **autorização baseada em CASL** (factory + guards).
 *
 * Registra {@link CaslAbilityFactory} (constrói `AppAbility` a partir do usuário), {@link ClaimsGuard}
 * (verifica claims via CASL) e {@link RolesGuard} (checagem de papel antes das claims). Importa
 * {@link AccountPersistenceModule} porque admins carregam claims do banco.
 *
 * **Inclusão:** importado em {@link AuthenticationGuardsModule} (e reexportado); `@Global()` garante uma única instância na aplicação.
 */
import { Global, Module, Provider } from '@nestjs/common';
import { AccountPersistenceModule } from 'src/app/account/application/persistence/account-persistence.module';
import { CaslAbilityFactory } from 'src/app/authentication/application/authorization/casl-ability.factory';
import { ClaimsGuard } from './claims.guard';
import { RolesGuard } from './roles.guard';

const providers: Provider[] = [
  CaslAbilityFactory,
  ClaimsGuard,
  RolesGuard,
];

@Global()
@Module({
  imports: [AccountPersistenceModule],
  providers: [...providers],
  exports: [...providers],
})
export class AuthorizationCaslModule {}
