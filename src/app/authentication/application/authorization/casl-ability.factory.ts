/**
 *
 * Monta a `Ability` CASL do usuário a partir do JWT (`Payload`) e persiste/regras de negócio.
 *
 * **Papel no CASL**
 * O CASL armazena um conjunto de regras “pode realizar `action` sobre `subject`”. Este factory traduz
 * claims (`{ subject, action }`) em chamadas `can(action, subject)` do `AbilityBuilder`, depois
 * retorna a ability “congelada” com `build()` para uso em {@link ClaimsGuard}.
 *
 * **Uso no projeto**
 * - `MongoAbility<[ClaimAction, ClaimSubject]>`: ação e assunto tipados (alinhado ao domínio).
 * - **Admin:** usa apenas as linhas de `AccountClaim`; se a lista estiver vazia, nenhuma regra `can` é
 *   aplicada (rotas protegidas por claim negam acesso).
 * - Pares inválidos em listas vindas do banco são ignorados em `applyClaims` (silencioso);
 *   rotas devem usar {@link Claim} para consistência.
 */
import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { Inject, Injectable } from '@nestjs/common';
import type { IAccountDao } from 'src/app/account/application/persistence/dao/account-dao.interface';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { type ClaimValue } from 'src/app/authentication/domain/authorization/claim';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { TOKENS } from 'src/core/di/token';
import { ClaimAction } from '../../domain/authorization/claim-action.enum';
import { ClaimSubject } from '../../domain/authorization/claim-subject.enum';
import { STATIC_CLAIMS } from './static-claims';

export type AppAbility = MongoAbility<[ClaimAction, ClaimSubject]>;

@Injectable()
export class CaslAbilityFactory {
  constructor(
    @Inject(TOKENS.AccountDao) private readonly accountDao: IAccountDao,
  ) {}

  public async createForUser(user: Payload): Promise<AppAbility> {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    switch (user.role) {
      case AccountRole.ADMIN:
        // TODO: cache to improve performance
        const fromDb = await this.accountDao.findClaimsByAccountId(user.sub);
        this.applyClaims(can, fromDb);
        break;
      default:
        const claims = STATIC_CLAIMS[user.role as Exclude<AccountRole, AccountRole.ADMIN>] ?? [];
        this.applyClaims(can, claims);
        break;
    }

    return build();
  }

  private applyClaims(can: AbilityBuilder<AppAbility>['can'], claims: readonly ClaimValue[]): void {
    for (const claim of claims) {
      can(claim.action, claim.subject);
    }
  }
}
