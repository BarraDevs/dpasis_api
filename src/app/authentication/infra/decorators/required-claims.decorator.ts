/**
 * Decorator que apenas **associa metadata** à rota: lista de claims exigidas (`REQUIRED_CLAIMS_KEY`).
 *
 * O CASL em si não lê este decorator; quem lê é o {@link ClaimsGuard} via `Reflector`. As strings devem
 * seguir `subject:action` válido (ver {@link parseClaimString}). Prefira constantes {@link Claim} para
 * type-safety. Para aplicar JWT + autenticação + papel + verificação CASL de uma vez, use
 * {@link RequiredRoles} ou combine com `UseGuards` manualmente.
 */
import { SetMetadata } from '@nestjs/common';
import type { ClaimValue } from 'src/app/authentication/domain/authorization/claim';
import { REQUIRED_CLAIMS_KEY } from './authorization-metadata.constants';

export const RequiredClaims = (...claims: ClaimValue[]) => SetMetadata(REQUIRED_CLAIMS_KEY, claims);
