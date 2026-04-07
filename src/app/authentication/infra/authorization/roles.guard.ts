/**
 * Guard que verifica se o `Payload.role` está entre os papéis exigidos no metadata (`REQUIRED_ROLES_KEY`).
 *
 * **Relação com CASL**
 * Não usa `@casl/ability` diretamente; roda **antes** do {@link ClaimsGuard} no pipeline de
 * {@link RequiredRoles}. Primeiro valida o papel (ex.: só ADMIN), depois o CASL valida as claims
 * (`bank:list`, etc.) carregadas pelo {@link CaslAbilityFactory}.
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { REQUIRED_ROLES_KEY } from 'src/app/authentication/infra/decorators/authorization-metadata.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!request?.user?.role) {
      return false;
    }

    const requiredRoles = this.reflector.getAllAndOverride<AccountRole[]>(REQUIRED_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles.length) {
      return false;
    }

    return !!requiredRoles.some(role => (request.user as Payload).role === role);
  }
}
