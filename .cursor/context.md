# Contexto Arquitetural — dpasis_api

> Passaporte arquitetural — leia no início de cada sessão antes de implementar qualquer coisa.

## Stack

- **Linguagem**: TypeScript 5.1 (target ES2022, module node16, `strictNullChecks` + `noImplicitAny`)
- **Framework principal**: NestJS 10 (Express, Passport, Swagger 8, BullMQ, Socket.IO)
- **Banco de dados**: PostgreSQL
- **ORM**: Prisma 5.22 com `previewFeatures = ["prismaSchemaFolder"]` (schema multi-arquivo em `prisma/schema/*.prisma`)
- **Autorização**: `@casl/ability` 6 (RBAC + claims) + `@nestjs/passport` + `passport-jwt`
- **Cache**: Redis 4 via `redis` (com adapter fake para testes)
- **Filas**: BullMQ 11 via `@nestjs/bullmq`
- **Storage**: AWS S3 via `@aws-sdk/client-s3`
- **HTTP externo**: `@nestjs/axios`
- **Validação**: `class-validator` + `class-transformer` (whitelist + transform globais)
- **Logger**: Winston 3 via gateway próprio
- **Testes**: Jest 29 + `@golevelup/ts-jest` (createMock) + supertest, modo `--runInBand`
- **DI Container**: NestJS IoC com tokens `Symbol.for(...)` em `src/core/di/token.ts`

## Arquitetura Adotada

**Hexagonal (Ports & Adapters)** com nomenclatura explícita `drivers` (entrada — controllers HTTP) e `driven` (saída — Prisma, gateways), combinada com **DDD-light** em módulos com regra de negócio rica (Entity privada + Factory `create/edit/load` + Repository). CRUDs simples usam apenas DAO. Sem CQRS, sem domain events, sem MediatR — orquestração é imperativa via service-to-service injection. Saga compensatória manual via try/catch + rollback explícito.

## Estrutura de Diretórios

```
src/
├── app/                              # Bounded contexts / módulos de feature
│   └── <contexto>/<modulo>/
│       ├── <modulo>.module.ts        # Imports + controllers + providers + exports
│       ├── domain/                   # ZERO deps de framework/infra
│       │   ├── entities/             # (DDD) Entity rica com _instantiate privado
│       │   ├── factories/            # (DDD) <Entity>Factory.create/edit/load
│       │   ├── value-objects/        # VOs específicos do contexto
│       │   ├── enums/
│       │   └── errors/               # Erros tipados extends AppException
│       ├── application/
│       │   ├── dtos/<modulo>.dto.ts            # DTO de saída do agregado
│       │   ├── persistence/
│       │   │   ├── <modulo>-persistence.module.ts
│       │   │   ├── dao/<modulo>-dao.interface.ts          # Port leitura
│       │   │   └── repository/<modulo>-repository.interface.ts  # (DDD) Port escrita
│       │   └── usecases/<verbo>-<modulo>/
│       │       ├── <verbo>-<modulo>.service.ts              # Use case
│       │       ├── <verbo>-<modulo>.service.spec.ts         # Unit (mocks)
│       │       ├── <verbo>-<modulo>.service.integration.spec.ts
│       │       └── dtos/<verbo>-<modulo>.dto.ts             # Input/Output
│       └── infra/
│           ├── drivers/http/admin/<modulo>-admin.controller.ts
│           ├── drivers/http/user/<modulo>-user.controller.ts
│           └── driven/persistence/prisma/
│               ├── <modulo>-prisma.dao.ts                   # Adapter DAO
│               └── <modulo>-prisma.repository.ts            # (DDD) Adapter Repository
├── core/                             # Plumbing global do app
│   ├── config/                       # ConfigService + Environment enum
│   ├── di/token.ts                   # Tokens DI (Symbol.for) — fonte única
│   ├── dtos/success-message.dto.ts   # SuccessMessage compartilhado
│   ├── filters/                      # AppException + HttpExceptionFilter (APP_FILTER)
│   └── types/find-by-id-options.type.ts
├── infra/                            # Gateways de infra (cross-cutting)
│   ├── cache/                        # Redis + fake (CacheModule.register())
│   ├── cep-lookup/                   # ViaCEP + fake
│   ├── cnpj-lookup/                  # CNPJa + fake
│   ├── database/                     # PrismaService (@Global) + truncate()
│   ├── logger/                       # Winston + fake
│   ├── openapi/                      # Decorator @Swagger custom + ClientError/ServerError
│   ├── queue/                        # BullMQ
│   ├── upload-file/                  # S3 + fake
│   └── validators/class/             # Queries, Params + Trim/StringToNumber/StringToBoolean
├── shared/                           # Reutilizáveis cross-context
│   ├── errors/                       # DocumentAlreadyTaken, EmailAlreadyTaken, ExternalApi
│   └── value-objects/                # CNPJ, CPF, Email, UUID, Pagination, Password, ...
├── app.module.ts                     # Compõe Core + Infra + módulos de feature
└── main.ts                           # Bootstrap: helmet, compression, CORS, ValidationPipe, Swagger

prisma/
├── schema/*.prisma                   # Multi-arquivo (schemaFolder)
└── seeds/                            # Seed scripts
```

## Regras de Ouro

1. **Domínio não depende de nada externo** — `domain/` é TS puro, sem `@nestjs/*`, `@prisma/*`, `class-validator`, `class-transformer`.
2. **Use cases orquestram, domínio valida** — invariantes vivem na entidade/Factory; orquestração e existência vivem no use case.
3. **Adapters implementam ports** — `Iyyy*` em `application/persistence/`, implementação em `infra/driven/`.
4. **Drivers só adaptam HTTP → use case** — controllers não contêm lógica.
5. **DAO retorna DTO; Repository retorna Entidade** — papéis claros e exclusivos no módulo DDD.
6. **Tokens DI vivem em `src/core/di/token.ts`** — único lugar permitido (`Symbol.for('Nome')`).
7. **Erros tipados extends `AppException`** — sem `BadRequestException` do Nest.
8. **Mensagens em português para o usuário final**, identificadores e código em inglês.
9. **Adapter de gateway sempre tem fake correspondente**, escolhido por `NODE_ENV === 'test'` em `XxxModule.register()`.
10. **Testes co-locados**: `*.spec.ts` (unit com mocks) + `*.integration.spec.ts` (banco real com `prisma.truncate()`).

## Onde Fica o Quê

| Artefato | Localização |
|---|---|
| Entidade rica | `src/app/<contexto>/<modulo>/domain/entities/<modulo>.entity.ts` |
| Factory | `src/app/<contexto>/<modulo>/domain/factories/<modulo>.factory.ts` |
| Erro de domínio | `src/app/<contexto>/<modulo>/domain/errors/<razão>.error.ts` |
| Erro transversal | `src/shared/errors/<razão>.ts` |
| Value Object reutilizável | `src/shared/value-objects/<vo>/<vo>.vo.ts` |
| Value Object do contexto | `src/app/<x>/<modulo>/domain/value-objects/<vo>/<vo>.vo.ts` |
| DTO de saída do agregado | `src/app/<x>/<modulo>/application/dtos/<modulo>.dto.ts` |
| Use Case | `src/app/<x>/<modulo>/application/usecases/<verbo>-<modulo>/<verbo>-<modulo>.service.ts` |
| Input/Output DTO de use case | `src/app/<x>/<modulo>/application/usecases/<verbo>-<modulo>/dtos/<verbo>-<modulo>.dto.ts` |
| DAO interface | `src/app/<x>/<modulo>/application/persistence/dao/<modulo>-dao.interface.ts` |
| Repository interface (DDD) | `src/app/<x>/<modulo>/application/persistence/repository/<modulo>-repository.interface.ts` |
| Persistence module | `src/app/<x>/<modulo>/application/persistence/<modulo>-persistence.module.ts` |
| DAO impl Prisma | `src/app/<x>/<modulo>/infra/driven/persistence/prisma/<modulo>-prisma.dao.ts` |
| Repository impl Prisma | `src/app/<x>/<modulo>/infra/driven/persistence/prisma/<modulo>-prisma.repository.ts` |
| Controller admin | `src/app/<x>/<modulo>/infra/drivers/http/admin/<modulo>-admin.controller.ts` |
| Controller user/público | `src/app/<x>/<modulo>/infra/drivers/http/user/<modulo>-user.controller.ts` |
| Module raiz da feature | `src/app/<x>/<modulo>/<modulo>.module.ts` |
| Schema Prisma | `prisma/schema/<modulo>.prisma` |
| Seed | `prisma/seeds/<modulo>.ts` (orquestrado em `seeds/index.ts`) |
| Token DI | `src/core/di/token.ts` (`<Entity>Dao`, `<Entity>Repository`, `<Categoria>Gateway`, `<Feature>QueueProducer`) |
| Fila — infra global (BullMQ + Redis) | `src/infra/queue/queue.module.ts` |
| Fila — `QueueName` / `JobName` enums | `src/infra/queue/enums/{queue-name,job-name}.enum.ts` |
| Fila — module por feature | `src/app/<x>/<modulo>/application/queue/<modulo>-queue.module.ts` |
| Fila — port producer | `src/app/<x>/<modulo>/application/queue/<modulo>-queue-producer.interface.ts` |
| Fila — payload de job | `src/app/<x>/<modulo>/application/queue/jobs/<verbo>-<recurso>-job.dto.ts` |
| Fila — adapter producer (BullMQ) | `src/app/<x>/<modulo>/infra/driven/queue/bullmq/<modulo>-queue-bullmq.producer.ts` |
| Fila — adapter producer (fake) | `src/app/<x>/<modulo>/infra/driven/queue/fake/<modulo>-queue-fake.producer.ts` |
| Fila — consumer (worker) | `src/app/<x>/<modulo>/infra/drivers/queue/bullmq/<modulo>-bullmq.consumer.ts` |
| Claim subject | `src/app/authentication/domain/authorization/claim-subject.enum.ts` |
| Claim catálogo | `src/app/authentication/domain/authorization/claim.ts` |
| Decorator de autorização (rota) | `@RequiredRoles(AccountRole.ADMIN)` + `@RequiredClaims(Claim.X_*)` |
| Decorator @Swagger | `src/infra/openapi/swagger.ts` |
| Gateway de infra | `src/infra/<categoria>/<categoria>.gateway.ts` (interface) e `adapters/<tecnologia>/...` (impl) |
| Filter global | `src/core/filters/http-exception/http-exception.filter.ts` (APP_FILTER) |
| Interceptor global | `src/app/audit/infra/interceptors/audit.interceptor.ts` (APP_INTERCEPTOR) |

## Decisões importantes registradas

- **Sem `prisma migrate`**: usa-se `prisma db push` (`npm run db:migration`); seeds via `npm run db:seed`. `npm run db:reset` faz tudo.
- **Sem `enum` do Prisma**: enums armazenados como `String` no banco e cast para enum TS no DAO.
- **Sem barrel files (`index.ts`)** nos módulos de feature.
- **Path absoluto** via `baseUrl: ./` (imports começam com `src/...`); sem path aliases tipo `@app/*`.
- **`forwardRef`** quando há ciclo entre módulos (caso real: `client` ↔ `client-address`).
- **Sub-módulos de agregado** (ex.: `client/`, `service/`, `resale/`) ficam em `src/app/<agregado>/<sub-modulo>/` e são listados em `<agregado>-module.module.ts` (note: nome do agregador termina em `ModuleModule`).
- **CASL fail-closed para admins**: admin sem claims em `account_claims` → CASL nega rotas protegidas por claim.

## Pré-requisitos para qualquer geração de código

1. Ler **`.cursor/rules/RULES.md`** (rules absolutas)
2. Ler a **skill específica** ao que está sendo feito (`.cursor/skills/<nome>/SKILL.md`)
3. Olhar um **exemplo real do código** (FAQ para CRUD simples; Admin para DDD; Client para casos com sub-módulos)
4. Em caso de divergência entre rules e skills, **as RULES vencem**; em caso de divergência entre skills e código, **o código vence** (e a skill deve ser atualizada)
