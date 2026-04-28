---
name: naming-conventions
description: >-
  Convenções de nomenclatura consolidadas para todos os artefatos do
  projeto: pastas, arquivos, classes, interfaces, DTOs, erros, tokens DI,
  models Prisma, mensagens de erro. Use ao nomear qualquer coisa nova,
  ao revisar nomes em PR, ao decidir entre singular/plural, ao escolher
  PascalCase/kebab-case/UPPER_SNAKE, ou quando o usuário disser "qual o
  nome", "como nomear X", "padrão de nome", "naming", "renomear", "nome
  da classe/arquivo".
---

# Convenções de Nomenclatura

## Contexto

Esta skill consolida todas as convenções de nomenclatura observadas no codebase. Use como **referência única** para qualquer novo artefato.

## Estrutura e Localização

Tabela mestre por categoria — exemplos diretamente do código.

## Como Fazer

### 1) Pastas e arquivos

| Artefato | Convenção | Exemplo |
|---|---|---|
| Pasta de feature | **kebab-case singular** | `client-attachment/`, `client-group/` |
| Pasta de use case | **kebab-case** com verbo+modulo | `create-faq/`, `find-all-admin/`, `update-faq-status/` |
| Arquivo `.ts` | **kebab-case** com sufixo descritivo | `faq.module.ts`, `create-faq.service.ts`, `faq-prisma.dao.ts` |
| Arquivo de teste | mesmo nome + `.spec.ts` ou `.integration.spec.ts` | `create-faq.service.spec.ts`, `create-faq.service.integration.spec.ts` |
| Arquivo Prisma | **kebab-case singular** | `prisma/schema/faq.prisma`, `prisma/schema/client-type.prisma` |
| Schema Prisma model | **PascalCase singular** | `model Faq`, `model ClientAttachment` |
| Tabela no banco | **plural snake_case** via `@@map` | `@@map("faqs")`, `@@map("client_attachments")` |

### 2) Classes e tipos

| Artefato | Convenção | Exemplo |
|---|---|---|
| Use case | **`<Verbo><Entity>`** PascalCase, sem sufixo | `CreateFaq`, `FindAllAdmin`, `UpdateFaqStatus` |
| Module | **`<Entity>Module`** | `FaqModule`, `AdminModule`, `ClientPersistenceModule` |
| Module agregador | **`<Agregado>ModuleModule`** (note duplicação) | `ClientModuleModule`, `ServiceModuleModule`, `ResaleModuleModule` |
| Interface (port) | **`I<Entity><Categoria>`** | `IFaqDao`, `IAdminRepository`, `ICacheGateway` |
| Adapter Prisma DAO | **`<Entity>DaoAdapterPrisma`** | `FaqDaoAdapterPrisma`, `AccountDaoAdapterPrisma` |
| Adapter Prisma Repository | **`<Entity>RepositoryAdapterPrisma`** | `AdminRepositoryAdapterPrisma`, `ClientRepositoryAdapterPrisma` |
| Adapter de gateway | **`<Gateway><Tecnologia>AdapterGateway`** | `CacheRedisAdapterGateway`, `LoggerWinstonAdapterGateway`, `UploadS3AdapterGateway` |
| Adapter fake | **`<Gateway>FakeAdapterGateway`** | `CacheFakeAdapterGateway`, `CnpjLookupFakeAdapterGateway` |
| Entity | **`<Singular>`** PascalCase (sem sufixo `Entity`) | `Admin`, `Client`, `Faq` (não `AdminEntity`) |
| Factory | **`<Entity>Factory`** | `AdminFactory`, `ClientFactory` |
| Value Object reutilizável | **`<Conceito>`** (sem sufixo `Vo`) | `Email`, `CNPJ`, `Pagination`, `Password` |
| Value Object com sufixo (raro) | **`<Conceito>Vo`** | `BooleanVo` (para evitar colisão com tipo nativo `Boolean`), `AdminSubjectPermissionsVo` |
| Erro | **`<Razão>Error`** | `FaqNotFoundError`, `DocumentAlreadyTakenError`, `InvalidEmailError` |
| Controller admin | **`<Entity>AdminController`** | `FaqAdminController`, `AdminAdminController` |
| Controller user/público | **`<Entity>UserController`** | `FaqUserController` |
| Guard | **`<Nome>Guard`** | `JwtAuthGuard`, `AuthenticationGuard`, `RolesGuard`, `ClaimsGuard` |
| Decorator | **`<Função>`** PascalCase como função | `RequiredRoles`, `RequiredClaims`, `User`, `Trim`, `StringToNumber` |
| Strategy | **`<Tipo>Strategy`** | `JwtStrategy`, `WebsocketStrategy` |
| Filter | **`<Categoria>ExceptionFilter`** | `HttpExceptionFilter` |
| Interceptor | **`<Função>Interceptor`** | `AuditInterceptor` |

### 3) DTOs

| Tipo | Padrão | Exemplo |
|---|---|---|
| DTO de saída do agregado | **`<Entity>Dto`** | `FaqDto`, `AdminDto`, `ClientDto` |
| DTO de saída específico | **`<Entity>With<X>Dto`** | `AdminWithClaimsDto`, `AccountWithSensitiveDataDto` |
| Input de use case | **`<Verbo><Entity>InputDto`** | `CreateFaqInputDto`, `EditAdminInputDto` |
| Output de use case | **`<Verbo><Entity>OutputDto`** | `CreateFaqOutputDto` (somente quando há retorno custom) |
| Query DTO de lista | **`FindAll<Entity>QueryDto`** | `FindAllFaqQueryDto`, `FindAllAdminQueryDto` |
| Sub-listagem | **`Find<Sub>QueryDto`** | `FindSubClientsQueryDto` |
| DTO genérico de path param | **`Params`** ou **`<Entity>Params`** | `Params` (id), `ParamsClientId` (clientId) |

### 4) Tokens DI

| Token | Padrão | Exemplo |
|---|---|---|
| DAO | **`<Entity>Dao`** | `TOKENS.FaqDao`, `TOKENS.AccountDao` |
| Repository | **`<Entity>Repository`** | `TOKENS.AdminRepository`, `TOKENS.ClientRepository` |
| Gateway | **`<Categoria>Gateway`** | `TOKENS.CacheGateway`, `TOKENS.LoggerGateway` |
| Repository especializado | **`<Entity><Função>Repository`** | `TOKENS.ClientSequenceRepository` |
| Producer de fila | **`<Categoria>QueueProducer`** | `TOKENS.UploadFileQueueProducer` |

Nome no `Symbol.for(...)` = **mesmo nome** do token: `Symbol.for('FaqDao')`.

### 5) Métodos

| Origem | Padrão | Exemplo |
|---|---|---|
| Use case (sempre) | **`public async execute(...)`** | `execute(data: CreateFaqInputDto)` |
| DAO findAll | **`findAll(queries)`** retorna `Promise<[Dto[], number]>` | |
| DAO findById | **`findById(id)`** retorna `Promise<Dto \| null>` | |
| DAO findBy<Critério> | **`findBy<Critério>(value)`** | `findByEmail`, `findByDocument` |
| DAO save (módulo simples) | **`save(data)`** retorna `Promise<number>` | |
| DAO edit (módulo simples) | **`edit(id, data)`** retorna `Promise<void>` | |
| DAO delete | **`delete(id)`** retorna `Promise<void>` | |
| DAO updateStatus | **`updateStatus(id, active)`** | |
| Repository save | **`save(entity, ...extras?)`** retorna `Promise<number>` | `save(entity: Admin, passwordHash: string)` |
| Repository edit | **`edit(entity)`** retorna `Promise<void>` | |
| Controller | **`create / findAll / findOne / update / updateStatus / activate / deactivate / remove`** | |
| Factory | **`static create() / static edit() / static load()`** | |

### 6) Enums

| Artefato | Convenção |
|---|---|
| Nome do enum | **`PascalCase`** (`AccountRole`, `ClaimAction`) |
| Valores | **`UPPER_SNAKE_CASE` strings** (`ADMIN = 'ADMIN'`, `Read = 'Read'`) |
| Arquivo | **`<nome>.enum.ts`** kebab-case |
| Pasta | dentro de `domain/enums/` |

⚠️ Há mistura observada nos valores: `AccountRole.ADMIN = 'ADMIN'` (UPPER) vs `ClaimAction.Read = 'Read'` (PascalCase). **Prefira `UPPER_SNAKE_CASE` para domínio**, e `PascalCase` somente quando o valor mapeia para um `subject`/`action` que aparece literal em strings de claims (como `'Faq'` → `Claim.FAQ_READ` espera `subject: ClaimSubject.Faq` literal).

### 7) Mensagens de erro

| Tipo | Convenção | Exemplo |
|---|---|---|
| Mensagens em DTOs (class-validator) | **pt-BR com `$property`** | `'$property é obrigatório'`, `'$property deve ser uma string'` |
| Mensagens em erros de domínio | **pt-BR** com substantivo + verbo no passado | `'FAQ não encontrado na base de dados.'`, `'O documento ${doc} já está em uso.'` |
| Mensagens em erros de VO | **pt-BR** com nome do campo | `'O campo name não pode ser vazio'` |

### 8) Comentários

- **JSDoc em pt-BR** nos pontos de extensão (CASL factory, guards, decorators de autorização)
- Comentários inline em pt-BR explicando decisões não óbvias (saga compensatória, ordem de delete antes de insert)
- **Sem** comentários banais que apenas narram (`// cria o usuário` antes de `prisma.user.create`)

### 9) Testes

| Artefato | Convenção |
|---|---|
| Sufixo | **`*.spec.ts`** (unit) e **`*.integration.spec.ts`** (integração) |
| `describe()` | **`'<Sujeito> - Unit tests'`** ou **`'<Sujeito> - Integration tests'`** |
| Variável | **`sut`** para o subject under test |
| Helper de input | **`makeValid<X>Input(overrides = {}): <X>InputDto`** |
| Triple-A | comentários `// Arrange`, `// Act`, `// Assert` |
| Primeiro teste | `it('should be defined', () => expect(sut).toBeDefined())` |

### 10) Idioma

- **Identificadores** (classes, métodos, variáveis, arquivos) em **inglês**
- **Mensagens de erro/validação ao usuário final** em **português**
- **Tags Swagger / `summary`** em **português**
- **Comentários técnicos** em **português** (idioma do time)

### 11) Imports

| Convenção | Exemplo |
|---|---|
| Path absoluto | `import { TOKENS } from 'src/core/di/token';` |
| Path relativo (mesmo módulo) | `import { CreateFaqInputDto } from './dtos/create-faq.dto';` |
| `import type` para interfaces injetadas | `import type { IFaqDao } from '...';` |
| Sem barrel files (`index.ts`) | Imports apontam para o arquivo final |

## Convenções Obrigatórias

Todas as listas acima são obrigatórias. Em caso de divergência:
1. **O código existente é a fonte de verdade**
2. Quando o código tem inconsistências (ex.: enums com valores em estilos diferentes), **siga o exemplo mais recente do mesmo contexto**
3. Em caso de dúvida absoluta, abra um PR pequeno propondo a convenção e aguarde revisão

## Anti-Padrões (Nunca Faça)

- ❌ Sufixo `Service` em use case (`CreateFaqService`). É só **`CreateFaq`**
- ❌ Sufixo `Entity` em entidade. É só **`Admin`**, **`Client`**
- ❌ Sufixo `UseCase` em use case. É só **`CreateFaq`**
- ❌ Prefixo `T` em type aliases (`TUser`). É só **`User`**, **`UserProps`**, **`UserCreateProps`**
- ❌ Pasta plural (`faqs/`). É **singular** (`faq/`)
- ❌ Model Prisma plural (`model Faqs`). É **singular** + `@@map("plural")`
- ❌ Nome de tabela diferente do `@@map`. Sempre **`@@map`** explícito
- ❌ camelCase em pastas/arquivos (`createFaq.service.ts`). É **kebab-case**
- ❌ snake_case em classes/tipos. É **PascalCase**
- ❌ Tokens com string (`'FaqDao'`). É **`Symbol.for('FaqDao')`** via `TOKENS.FaqDao`
- ❌ Mensagens de erro em inglês para o usuário final
- ❌ DTOs como `interface`. São **`class`** (precisam dos decorators)
- ❌ Inconsistência cliente/cliente-attachment/clientGroup. **kebab-case** sempre

## Exemplo Completo

Diferença lado a lado de nomenclatura entre módulo simples e DDD:

**Módulo simples (FAQ)** — sem entity, sem factory, só DAO:

```
src/app/faq/
├── faq.module.ts
├── domain/errors/faq-not-found.error.ts
├── application/
│   ├── dtos/faq.dto.ts                                # FaqDto
│   ├── persistence/
│   │   ├── faq-persistence.module.ts                  # FaqPersistenceModule
│   │   └── dao/faq-dao.interface.ts                   # IFaqDao
│   └── usecases/create-faq/
│       ├── create-faq.service.ts                      # CreateFaq (no Service suffix)
│       └── dtos/create-faq.dto.ts                     # CreateFaqInputDto, CreateFaqOutputDto
└── infra/
    ├── drivers/http/admin/faq-admin.controller.ts     # FaqAdminController
    └── driven/persistence/prisma/faq-prisma.dao.ts    # FaqDaoAdapterPrisma
```

Token: `TOKENS.FaqDao = Symbol.for('FaqDao')`.

**Módulo DDD (Admin)** — adiciona entity + factory + repository:

```
src/app/admin/
├── admin.module.ts
├── domain/
│   ├── entities/admin.entity.ts                       # Admin
│   ├── factories/admin.factory.ts                     # AdminFactory
│   ├── value-objects/admin-subject-permissions/...    # AdminSubjectPermissionsVo
│   ├── enums/permission-level.enum.ts                 # PermissionLevel
│   └── errors/admin-not-found.error.ts                # AdminNotFoundError
├── application/
│   ├── dtos/admin.dto.ts                              # AdminDto, AdminWithClaimsDto
│   └── persistence/
│       ├── admin-persistence.module.ts                # AdminPersistenceModule
│       ├── dao/admin-dao.interface.ts                 # IAdminDao
│       └── repository/admin-repository.interface.ts   # IAdminRepository
└── infra/driven/persistence/prisma/
    ├── admin-prisma.dao.ts                            # AdminDaoAdapterPrisma
    └── admin-prisma.repository.ts                     # AdminRepositoryAdapterPrisma
```

Tokens: `TOKENS.AdminDao`, `TOKENS.AdminRepository`.
