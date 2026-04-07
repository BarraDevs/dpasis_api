/**
 *
 * Guard NestJS que **exige** que o usuário autenticado tenha todas as claims declaradas no metadata.
 *
 * **Papel no CASL**
 * Não cria regras; apenas obtém a `AppAbility` já montada pelo {@link CaslAbilityFactory} e avalia
 * `ability.can(action, subject)` para cada claim obrigatória.
 * Se faltar qualquer permissão, responde com erro de autorização.
 *
 * **Uso no projeto**
 * Normalmente acoplado a {@link RequiredRoles}: JWT → {@link AuthenticationGuard} → {@link RolesGuard}
 * (papel) → este guard (claims finas). O metadata `REQUIRED_CLAIMS_KEY` vem de {@link RequiredClaims} ou do
 * compositor de rotas que define as claims junto com o papel.
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from 'src/app/authentication/application/authorization/casl-ability.factory';
import type { ClaimValue } from 'src/app/authentication/domain/authorization/claim';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { REQUIRED_CLAIMS_KEY } from 'src/app/authentication/infra/decorators/authorization-metadata.constants';

@Injectable()
export class ClaimsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredClaims = this.reflector.getAllAndOverride<ClaimValue[]>(REQUIRED_CLAIMS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredClaims || requiredClaims.length === 0) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as Payload | undefined;
    if (!user) {
      return false;
    }

    // create the ability with all claims only once to avoid database (or cache) calls per claim
    const ability = await this.caslAbilityFactory.createForUser(user);

    // check if the user has all the required claims
    for (const claim of requiredClaims) {
      if (!ability.can(claim.action, claim.subject)) {
        return false;
      }
    }

    return true;
  }
}
