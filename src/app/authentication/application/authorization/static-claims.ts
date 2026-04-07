/**
 * Claims fixas por papel **não admin**, consumidas pelo {@link CaslAbilityFactory}.
 *
 * No CASL, essas entradas viram as mesmas regras `can(action, subject)` que as claims dinâmicas do admin;
 * a diferença é apenas a origem (código em deploy, não `AccountClaim`). Amplie este mapa quando novas
 * rotas HTTP forem expostas a vendedores ou outros papéis.
 */
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import type { ClaimValue } from 'src/app/authentication/domain/authorization/claim';

export const STATIC_CLAIMS: Record<Exclude<AccountRole, AccountRole.ADMIN>, ClaimValue[]> = {
  [AccountRole.SELLER]: [],
};
