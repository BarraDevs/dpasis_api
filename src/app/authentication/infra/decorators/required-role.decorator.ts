import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { ServerError } from 'src/infra/openapi/error.dto';
import { AuthenticationGuard } from '../../application/guards/authentication/authentication.guard';
import { AuthorizationGuard } from '../../application/guards/authorization/authorization.guard';
import { JwtAuthGuard } from '../strategies/jwt/jwt.guard';
import { SetRoles } from './set-role.decorator';

export function RequiredRoles(...roles: AccountRole[]) {
  return applyDecorators(
    SetRoles(...roles),
    UseGuards(JwtAuthGuard, AuthenticationGuard, AuthorizationGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ type: ServerError, description: 'Unauthorized' }),
    ApiForbiddenResponse({ type: ServerError, description: 'Forbidden' }),
  );
}
