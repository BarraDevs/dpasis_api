import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { ROLE_KEY } from 'src/app/authentication/infra/decorators/set-role.decorator';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!request?.user?.roles) {
      return false;
    }

    const requiredRoles = this.reflector.getAllAndOverride<AccountRole[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles.length) {
      return true;
    }

    return !!requiredRoles.some(role => (request.user as Payload).roles.includes(role));
  }
}
