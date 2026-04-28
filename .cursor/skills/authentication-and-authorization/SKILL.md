---
name: authentication-and-authorization
description: >-
  Sistema de autenticação JWT + autorização CASL (RBAC + claims) do projeto.
  Use ao proteger uma rota nova, ao adicionar uma claim/subject, ao criar
  um decorator de autorização, ao escrever um guard, ao entender o pipeline
  de guards aplicado por @RequiredRoles, ou quando o usuário disser
  "proteger rota", "adicionar permissão", "RBAC", "CASL", "JWT", "como
  pegar usuário logado", "decorator @User", "claim", "guard", "ability",
  "rota de admin", "rota pública".
---

# Autenticação e Autorização

## Contexto

O projeto combina:

- **JWT (Passport)** para autenticação stateless — strategy em `infra/strategies/jwt/`
- **CASL (`@casl/ability`)** para autorização fine-grained — `MongoAbility<[ClaimAction, ClaimSubject]>`
- **Catálogo `Claim`** (`src/app/authentication/domain/authorization/claim.ts`) com pares `{ subject, action }` (atualmente só `_READ` / `_WRITE`)
- **Persistência por admin**: `account_claims` (FK em `accounts`) — admin com lista vazia de claims **não tem permissão CASL** (fail-closed)
- **Static claims por papel não-admin**: definidos em `static-claims.ts`

O pipeline de guards aplicado em rotas administrativas é:

```
JwtAuthGuard → AuthenticationGuard → RolesGuard → ClaimsGuard
```

Composto pelo decorator **`@RequiredRoles(AccountRole.X)`**.

## Estrutura e Localização

```
src/app/authentication/
├── authentication.module.ts                      # JWT + Passport + AccountModule + Guards
├── domain/
│   ├── authorization/
│   │   ├── claim.ts                              # Catálogo Claim (X_READ, X_WRITE)
│   │   ├── claim-action.enum.ts                  # ClaimAction.Read, ClaimAction.Write
│   │   └── claim-subject.enum.ts                 # ClaimSubject.Faq, .Admin, ...
│   └── types/payload.type.ts                     # { sub, role, ... }
├── application/
│   ├── authorization/
│   │   ├── casl-ability.factory.ts               # CaslAbilityFactory.createForUser(payload)
│   │   └── static-claims.ts                      # Claims fixas por role não-admin
│   ├── guards/
│   │   ├── authentication/authentication.guard.ts # Verifica account ativo + cache
│   │   └── guards.module.ts                      # AuthenticationGuardsModule (exporta CASL)
│   └── usecases/signin-with-credential-and-password/
│       └── ...
└── infra/
    ├── authorization/
    │   ├── authorization-casl.module.ts
    │   ├── claims.guard.ts                       # Avalia ability.can(action, subject)
    │   └── roles.guard.ts                        # Verifica role no payload
    ├── decorators/
    │   ├── authorization-metadata.constants.ts   # REQUIRED_ROLES_KEY, REQUIRED_CLAIMS_KEY
    │   ├── required-claims.decorator.ts          # @RequiredClaims(Claim.X_WRITE)
    │   ├── required-role.decorator.ts            # @RequiredRoles(AccountRole.ADMIN)
    │   └── user.decorator.ts                     # @User() — pega req.user
    ├── strategies/
    │   ├── jwt/jwt.strategy.ts
    │   ├── jwt/jwt.guard.ts
    │   ├── jwt/jwt.module.ts
    │   ├── websocket/websocket.strategy.ts
    │   └── websocket/websocket.guard.ts
    └── drivers/http/authentication.controller.ts
```

## Como Fazer

### 1) Proteger uma rota administrativa

No controller (`infra/drivers/http/admin/<modulo>-admin.controller.ts`), aplique:

```typescript
@Controller('admin/faq')
@RequiredRoles(AccountRole.ADMIN)         // <- aplica o pipeline JWT + Auth + Roles + Claims
export class FaqAdminController {
  // ...

  @Post()
  @RequiredClaims(Claim.FAQ_WRITE)        // <- claim fina exigida nesta operação
  @Swagger({ ... })
  public create(@Body() body: CreateFaqInputDto) { ... }

  @Get()
  @RequiredClaims(Claim.FAQ_READ)
  public findAll(@Query() queries: FindAllFaqQueryDto) { ... }
}
```

`@RequiredRoles(AccountRole.ADMIN)` no nível da classe + `@RequiredClaims(Claim.X_*)` em cada método.

### 2) Rota pública (sem autenticação)

Não use `@RequiredRoles`. Apenas o `Controller`:

```typescript
@Controller('user/faq')
export class FaqUserController {
  @Get()
  @Swagger({ tags: ['FAQs - Público'], summary: '...' })
  public findAll(@Query() queries: FindAllFaqQueryDto) { ... }
}
```

### 3) Pegar o usuário logado em uma rota protegida

```typescript
import { User } from 'src/app/authentication/infra/decorators/user.decorator';
import { Payload } from 'src/app/authentication/domain/types/payload.type';

@Get('me')
public me(@User() user: Payload) {
  return this.findAccountById.execute(user.sub);
}
```

### 4) Adicionar uma nova claim

a) Acrescente o subject em `claim-subject.enum.ts`:

```typescript
export enum ClaimSubject {
  // ...
  Faq = 'Faq',
  MeuNovoSubject = 'MeuNovoSubject',
}
```

b) Adicione o par no catálogo `claim.ts`:

```typescript
export const Claim = {
  // ...
  MEU_NOVO_SUBJECT_READ: { subject: ClaimSubject.MeuNovoSubject, action: ClaimAction.Read },
  MEU_NOVO_SUBJECT_WRITE: { subject: ClaimSubject.MeuNovoSubject, action: ClaimAction.Write },
} as const;
```

c) Use no controller: `@RequiredClaims(Claim.MEU_NOVO_SUBJECT_WRITE)`.

d) Garanta que admins tenham essa claim — via UI de gestão de admins ou via seed (`prisma/seeds/account-claims.ts`).

### 5) Importar o stack de guards no módulo

Todo módulo com rotas protegidas precisa importar `AuthenticationGuardsModule`:

```typescript
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';

@Module({
  imports: [
    FaqPersistenceModule,
    AuthenticationGuardsModule,    // <- traz JwtAuthGuard, AuthenticationGuard, RolesGuard, ClaimsGuard, CASL
  ],
  // ...
})
```

`AuthenticationGuardsModule` re-exporta `AccountModule + AuthorizationCaslModule + AuthenticationGuard`.

### 6) Pipeline de guards (composição via `@RequiredRoles`)

```21:29:src/app/authentication/infra/decorators/required-role.decorator.ts
export function RequiredRoles(...roles: AccountRole[]) {
  return applyDecorators(
    SetMetadata(REQUIRED_ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, AuthenticationGuard, RolesGuard, ClaimsGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ type: ServerError, description: 'Unauthorized' }),
    ApiForbiddenResponse({ type: ServerError, description: 'Forbidden' }),
  );
}
```

Ordem dos guards:
1. **`JwtAuthGuard`** — valida token JWT, popula `request.user`
2. **`AuthenticationGuard`** — busca account no banco (com cache de 30s) e bloqueia inativos
3. **`RolesGuard`** — checa `request.user.role ∈ roles`
4. **`ClaimsGuard`** — monta `AppAbility` via `CaslAbilityFactory.createForUser(payload)` e avalia `ability.can(action, subject)` para cada claim do `@RequiredClaims`

### 7) CASL: como as claims viram regras

```36:52:src/app/authentication/application/authorization/casl-ability.factory.ts
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
```

- **Admin**: claims vêm do banco (`account_claims`). Lista vazia ⇒ rotas protegidas por claim negam (fail-closed)
- **Outros papéis**: claims fixas em `STATIC_CLAIMS[role]`

### 8) Cache de account (auth pipeline)

```40:57:src/app/authentication/application/guards/authentication/authentication.guard.ts
  private async getAccount(accountId: number): Promise<AccountDto | null> {
    const key = new CacheKeyBuilder()
      .setResource('account')
      .setCommand('detail', accountId.toString())
      .build();

    const cachedAccount = await this.cacheGateway.get<AccountDto>(key);
    if (cachedAccount) {
      return cachedAccount;
    }

    const account = await this.findAccountByIdService.execute(accountId);
    if (account) {
      await this.cacheGateway.set(key, account, 30, true);
    }

    return account;
  }
```

TTL de 30s. Se o admin for inativado, ele continua autenticado por até 30s — invalide o cache se necessário no use case de inativação.

### 9) WebSockets

`WebsocketGuard` + `WebsocketStrategy` cobrem o canal WS. O `AuthenticationGuard` é polimórfico (detecta `context.getType() === 'ws'`).

## Convenções Obrigatórias

- **Toda rota administrativa** tem `@RequiredRoles(AccountRole.ADMIN)` no controller (nível classe)
- **Cada método mutador ou de leitura sensível** tem `@RequiredClaims(Claim.X_WRITE | X_READ)`
- Claims vivem **exclusivamente** em `claim.ts` como objeto `Claim` const (`as const`)
- Subjects ficam em `claim-subject.enum.ts` (`PascalCase` no nome e no value)
- Actions ficam em `claim-action.enum.ts` (`Read`, `Write`)
- Para usuário, prefira **`@User() user: Payload`** ao acessar `request.user` direto
- Módulo com rotas protegidas SEMPRE importa `AuthenticationGuardsModule`
- Senhas SEMPRE armazenadas como hash via `new Password(plain).value` (bcrypt)
- Strategy JWT lê `JWT_SECRET` via `ConfigService.jwtSecret`

## Anti-Padrões (Nunca Faça)

- ❌ `@UseGuards(...)` manual em controller administrativo. Use `@RequiredRoles(...)` que já compõe tudo
- ❌ `request.user.sub` direto em controller. Use `@User()`
- ❌ Acesso a `accountDao.findClaimsByAccountId` fora do `CaslAbilityFactory`. Esse é o ponto único
- ❌ Claim no formato `'faq:write'` (string). Use o catálogo tipado `Claim.FAQ_WRITE`
- ❌ Esquecer `@RequiredClaims(...)` em algum método de controller administrativo. Sem claim → CASL nega tudo
- ❌ Adicionar nova claim sem registrar em `claim-subject.enum.ts` E em `claim.ts`
- ❌ Hardcodar JWT secret. Sempre via `ConfigService.jwtSecret`
- ❌ Trocar bcrypt por md5/sha. Use `Password` VO

## Exemplo Completo

Controller administrativo completo do FAQ — pipeline + decorators + Swagger:

```21:55:src/app/faq/infra/drivers/http/admin/faq-admin.controller.ts
@Controller('admin/faq')
@RequiredRoles(AccountRole.ADMIN)
export class FaqAdminController {
  constructor(
    private readonly createFaq: CreateFaq,
    private readonly findAllFaq: FindAllFaq,
    private readonly findFaqById: FindFaqById,
    private readonly editFaq: EditFaq,
    private readonly updateFaqStatus: UpdateFaqStatus,
    private readonly deleteFaq: DeleteFaq,
  ) {}

  @Post()
  @RequiredClaims(Claim.FAQ_WRITE)
  @Swagger({
    tags: ['FAQs'],
    summary: 'Criar nova FAQ',
    applyBadRequest: true,
    createdResponse: CreateFaqOutputDto,
  })
  public create(@Body() body: CreateFaqInputDto): Promise<CreateFaqOutputDto> {
    return this.createFaq.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.FAQ_READ)
  @Swagger({
    tags: ['FAQs'],
    summary: 'Listar FAQs com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: FaqDto,
  })
  public findAll(@Query() queries: FindAllFaqQueryDto): Promise<IPagination<FaqDto>> {
    return this.findAllFaq.execute(queries);
  }
```
