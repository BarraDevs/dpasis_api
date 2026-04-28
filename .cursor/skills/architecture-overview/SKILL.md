---
name: architecture-overview
description: >-
  Visão geral da arquitetura Hexagonal (Ports & Adapters) do dpasis_api.
  Use SEMPRE que precisar entender como o projeto está organizado, onde colocar
  novo código, quais camadas existem, regras de dependência entre camadas, ou
  quando o usuário perguntar "qual a arquitetura?", "onde fica X?", "posso
  importar Y de Z?", "qual o fluxo de uma requisição?", "como o app está
  estruturado?". Também útil ao planejar refatorações e revisar PRs.
---

# Visão Geral da Arquitetura

## Contexto

O `dpasis_api` é uma API NestJS + Prisma estruturada como **Arquitetura Hexagonal (Ports & Adapters)** com nomenclatura explícita `drivers` (entrada) e `driven` (saída). Em módulos com regras de negócio ricas, adota-se **DDD-light** (entity + factory + repository) — sem CQRS, sem event sourcing e sem domain events.

O bootstrap fica em `src/main.ts`, registra `helmet`, `compression`, CORS aberto, `ValidationPipe({ whitelist: true, transform: true })` global, Swagger em `/swagger` e instancia `AppModule`.

## Estrutura e Localização

```
src/
├── app/                      # Módulos de feature (bounded contexts)
│   └── <contexto>/<modulo>/
│       ├── <modulo>.module.ts
│       ├── domain/           # ZERO dependências de framework/infra
│       ├── application/      # Use cases, DTOs, ports (DAO/Repository)
│       └── infra/
│           ├── drivers/      # Adapters de ENTRADA (controllers HTTP)
│           └── driven/       # Adapters de SAÍDA (Prisma, etc.)
├── core/                     # Plumbing global do app
│   ├── config/               # ConfigService + Environment enum
│   ├── di/token.ts           # Tokens DI (Symbol.for) centralizados
│   ├── dtos/                 # SuccessMessage compartilhado
│   ├── filters/              # AppException + HttpExceptionFilter (APP_FILTER)
│   └── types/                # FindByIdOptions, etc.
├── infra/                    # Gateways de infra (cross-cutting)
│   ├── cache/                # Redis + fake
│   ├── cep-lookup/           # ViaCEP + fake
│   ├── cnpj-lookup/          # CNPJa + fake
│   ├── database/             # PrismaService (@Global)
│   ├── logger/               # Winston + fake
│   ├── openapi/              # Decorator @Swagger e ClientError/ServerError
│   ├── queue/                # BullMQ
│   ├── upload-file/          # S3 + fake
│   └── validators/class/     # Queries, Params + Trim/StringToNumber/...
├── shared/                   # Reutilizáveis cross-context
│   ├── errors/               # Erros transversais (DocumentAlreadyTaken, etc.)
│   └── value-objects/        # CNPJ, CPF, Email, UUID, Pagination, ...
├── app.module.ts             # Compõe Core + Infra + módulos de feature
└── main.ts
```

## Como Fazer

### Fluxo de uma requisição HTTP típica

1. **Request** chega no Express
2. `helmet` + `compression` + CORS (em `main.ts`)
3. `ValidationPipe` global transforma e valida o DTO
4. **Composição de guards** via `@RequiredRoles(AccountRole.ADMIN)`:
   `JwtAuthGuard` → `AuthenticationGuard` → `RolesGuard` → `ClaimsGuard`
5. **Controller** (`src/app/<x>/infra/drivers/http/...`) injeta o use case e chama `useCase.execute(...)`
6. **Use case** (`src/app/<x>/application/usecases/<verbo>/...`) orquestra:
   - Valida invariantes (chamando `Factory`/VOs do domínio)
   - Faz queries via DAO (port)
   - Persiste via Repository (em módulos DDD) ou DAO (em CRUDs simples)
7. **Adapter Prisma** (`src/app/<x>/infra/driven/persistence/prisma/...`) executa SQL
8. Erros do tipo `AppException` são capturados pelo `HttpExceptionFilter` global
9. Mutações (POST/PATCH/PUT/DELETE) passam pelo `AuditInterceptor` (registrado em `AuditModule` via `APP_INTERCEPTOR`) e são persistidas em `audit_logs`

### Regras de dependência entre camadas (OBRIGATÓRIAS)

| De ↓ \ Para → | `domain` | `application` | `infra/drivers` | `infra/driven` |
|---|---|---|---|---|
| `domain` | ✅ | ❌ | ❌ | ❌ |
| `application` | ✅ | ✅ (mesmo módulo) | ❌ | ❌ |
| `infra/drivers` | ✅ | ✅ | ✅ | ❌ |
| `infra/driven` | ✅ | ✅ (apenas ports) | ❌ | ✅ |

Regra de ouro: **a seta sempre aponta de fora para dentro**. `domain` é a parte mais interna e nunca conhece nada do mundo externo.

### Regras adicionais detectadas

- **Tokens DI** vivem em `src/core/di/token.ts` como `Symbol.for('NomeDoPort')`. Nenhum outro lugar declara tokens
- **`PrismaService` é `@Global`** (`infra/database/database.module.ts`) — não precisa importar `DatabaseModule` em features de leitura, mas o `<x>-persistence.module.ts` do módulo importa explicitamente
- **`CacheModule`, `LoggerModule`** também são `@Global` e exportam o token do gateway
- **`ConfigService` (custom)** envolve `@nestjs/config` e expõe getters tipados (`isProduction`, `databaseUrl`, etc.) — sempre injete `ConfigService` em vez de ler `process.env` direto
- O agregado `client` é composto de **13 sub-módulos** sob `src/app/client/`, agregados por `client-module.module.ts`. O mesmo padrão é seguido por `service-module.module.ts` e `resale-module.module.ts`

## Convenções Obrigatórias

- Toda feature segue **`domain/`, `application/`, `infra/`** como subpastas
- Adapters de entrada ficam em **`infra/drivers/<protocolo>/<canal>/`** (ex.: `http/admin/`, `http/user/`)
- Adapters de saída ficam em **`infra/driven/<categoria>/<tecnologia>/`** (ex.: `persistence/prisma/`)
- Ports são **interfaces** em `application/persistence/dao/` e `application/persistence/repository/`
- Cada feature tem um arquivo `<modulo>.module.ts` na raiz que declara `imports`, `controllers`, `providers`, `exports`
- Cada feature tem um `<modulo>-persistence.module.ts` em `application/persistence/` que faz o binding `TOKEN → Adapter`

## Anti-Padrões (Nunca Faça)

- ❌ Importar `@prisma/client` em `domain/` ou `application/` (exceto types `Prisma.XWhereInput` no adapter, que fica em `infra/driven/persistence/prisma/`)
- ❌ Injetar `PrismaService` em use cases (use cases consomem **ports**, nunca tecnologia concreta)
- ❌ Criar nova feature sem seguir as três pastas `domain/application/infra`
- ❌ Adicionar tokens DI fora de `src/core/di/token.ts`
- ❌ Usar `process.env` diretamente em qualquer lugar que não seja `ConfigService` ou `main.ts`
- ❌ Acoplar dois módulos de feature por DAO direto. A comunicação correta é importar o `Module` do outro contexto e injetar um **use case exportado** (ex.: `CreateClient` injeta `FindClientGroupById`, não `IClientGroupDao`)
- ❌ Lançar `HttpException` do Nest. Sempre estenda `AppException` em `domain/errors/<contexto>/` ou `shared/errors/`

## Exemplo Completo

`FaqAdminController` (driver HTTP, em `src/app/faq/infra/drivers/http/admin/`) chama o use case `CreateFaq` (em `src/app/faq/application/usecases/create-faq/`), que injeta `IFaqDao` via `@Inject(TOKENS.FaqDao)`. O binding fica em `FaqPersistenceModule` (`src/app/faq/application/persistence/`), que liga `TOKENS.FaqDao` → `FaqDaoAdapterPrisma` (em `src/app/faq/infra/driven/persistence/prisma/`). Tudo é orquestrado pelo `FaqModule` em `src/app/faq/faq.module.ts`, importado em `src/app.module.ts`.

```20:33:src/app.module.ts
@Module({
  imports: [
    CoreModule,
    InfraModule,
    AuthenticationModule,
    AuditModule,
    AdminModule,
    CompanyModule,
    ClientModuleModule,
    ResaleModuleModule,
    ExternalApisModule,
    FaqModule,
    GlobalModule,
    ServiceModuleModule,
    UploadFileModule,
  ],
})
```
