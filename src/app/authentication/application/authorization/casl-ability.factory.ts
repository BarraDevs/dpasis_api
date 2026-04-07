/**
 *
 * Monta a `Ability` CASL do usuário a partir do JWT (`Payload`) e persiste/regras de negócio.
 *
 * **Papel no CASL**
 * O CASL armazena um conjunto de regras “pode realizar `action` sobre `subject`”. Este factory traduz
 * as strings `subject:action` (claims) em chamadas `can(action, subject)` do `AbilityBuilder`, depois
 * retorna a ability “congelada” com `build()` para uso em {@link ClaimsGuard}.
 *
 * **Uso no projeto**
 * - `MongoAbility<[string, string]>`: ação e assunto são strings (alinhado às rotas e ao domínio).
 * - Claims inválidas ou malformadas em listas vindas do banco são ignoradas em `applyClaims` (silencioso);
 *   rotas devem usar {@link Claim} / {@link parseClaimString} para consistência.
 */
import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { Inject, Injectable } from '@nestjs/common';
import type { IAccountDao } from 'src/app/account/application/persistence/dao/account-dao.interface';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { ALL_CLAIM_VALUES, parseClaimString } from 'src/app/authentication/domain/authorization/claim';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { TOKENS } from 'src/core/di/token';
import { STATIC_CLAIMS } from './static-claims';

export type AppAbility = MongoAbility<[string, string]>;

@Injectable()
export class CaslAbilityFactory {
  constructor(
    @Inject(TOKENS.AccountDao) private readonly accountDao: IAccountDao,
  ) {}

  public async createForUser(user: Payload, subject?: string, action?: string): Promise<AppAbility> {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    switch (user.role) {
      case AccountRole.ADMIN:
        // TODO: cache to improve performance
        const fromDb = await this.accountDao.findClaimStringsByAccountId(user.sub);
        const adminClaims = fromDb.length > 0 ? fromDb : [...ALL_CLAIM_VALUES];
        this.applyClaims(can, adminClaims, subject, action);
        break;
      default:
        const claims = STATIC_CLAIMS[user.role as Exclude<AccountRole, AccountRole.ADMIN>] ?? [];
        this.applyClaims(can, claims, subject, action);
        break;
    }

    return build();
  }

  private applyClaims(
    can: AbilityBuilder<AppAbility>['can'],
    claims: readonly string[],
    subject?: string,
    action?: string,
  ): void {
    const parsedClaims = claims.map(claim => parseClaimString(claim));

    // filter claims by subject prefix to reduce the number of claims to apply
    // i can also filter by action to reduce even more the number of claims to apply.
    const filteredClaims = parsedClaims
      .filter(claim => claim !== null && claim !== undefined)
      .filter(claim => subject ? claim?.subject === subject : true)
      .filter(claim => action ? claim?.action === action : true)
      .map(claim => claim);

    for (const claim of filteredClaims) {
      can(claim.action, claim.subject);
    }
  }
}
