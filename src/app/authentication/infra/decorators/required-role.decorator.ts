/**
 * Compositor de rota para **admin (e papéis similares)** com pipeline completo de segurança.
 *
 * Ordem dos guards: `JwtAuthGuard` → {@link AuthenticationGuard} → {@link RolesGuard} → {@link ClaimsGuard}.
 * - **RolesGuard:** garante o `AccountRole` (coarse).
 * - **ClaimsGuard:** aplica CASL sobre as claims exigidas no metadata (fine-grained).
 *
 * Documentação OpenAPI inclui 401/403. As claims obrigatórias por rota devem ser definidas com
 * {@link RequiredClaims} (ou metadata equivalente) para o último guard avaliar `ability.can(...)`.
 */
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { ServerError } from 'src/infra/openapi/error.dto';
import { AuthenticationGuard } from '../../application/guards/authentication/authentication.guard';
import { ClaimsGuard } from '../authorization/claims.guard';
import { RolesGuard } from '../authorization/roles.guard';
import { JwtAuthGuard } from '../strategies/jwt/jwt.guard';
import { REQUIRED_ROLES_KEY } from './authorization-metadata.constants';

export function RequiredRoles(...roles: AccountRole[]) {
  return applyDecorators(
    SetMetadata(REQUIRED_ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, AuthenticationGuard, RolesGuard, ClaimsGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ type: ServerError, description: 'Unauthorized' }),
    ApiForbiddenResponse({ type: ServerError, description: 'Forbidden' }),
  );
}
