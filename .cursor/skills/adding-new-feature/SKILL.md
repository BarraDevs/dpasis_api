---
name: adding-new-feature
description: >-
  Checklist end-to-end para adicionar uma funcionalidade nova no projeto.
  Use SEMPRE que o usuário pedir uma feature do zero, um novo CRUD, um
  novo módulo, um novo recurso, ou disser "implementar X", "adicionar
  funcionalidade Y", "criar feature", "novo endpoint", "como começar X
  do zero", "fluxo completo", "feature completa", "scaffolding". Esta
  skill é o roteiro mestre que aciona as outras skills no momento certo.
---

# Adicionando uma Nova Funcionalidade

## Contexto

Esta skill é o **mapa do tesouro**: lista a sequência completa de passos para entregar uma feature nova respeitando arquitetura, convenções, autorização, testes e documentação. Ela referencia outras skills no ponto certo de cada passo.

⚠️ **Antes de começar**: confirme se a feature é um **CRUD novo** (criar módulo) ou uma **extensão de módulo existente** (adicionar use case/rota). Os passos abaixo cobrem o caso completo "novo módulo CRUD". Para extensões, pule os passos de criação de pasta/módulo.

## Estrutura e Localização

A entrega de uma feature CRUD nova toca essas áreas:

```
src/app/<contexto>/<modulo>/                    # Código novo
prisma/schema/<modulo>.prisma                   # Schema novo
src/core/di/token.ts                            # Adicionar tokens
src/app/authentication/domain/authorization/
├── claim-subject.enum.ts                       # Adicionar subject
└── claim.ts                                    # Adicionar claims
src/infra/database/prisma/prisma.service.ts     # Adicionar truncate
src/app.module.ts                               # Importar módulo (ou agregador)
postman/                                        # (opcional) regenerar coleção
```

## Como Fazer

### Checklist Master — Novo Módulo CRUD

Siga **na ordem** abaixo. Marque conforme avança.

#### 0. Levantamento

- [ ] Nome do módulo decidido (kebab-case singular, ex.: `client-attachment`)
- [ ] Bounded context destino (`src/app/<contexto>/`) — ou raiz se for top-level
- [ ] Lista de campos com tipos e tamanhos (para schema + DTO)
- [ ] Relacionamentos identificados (FK, cardinalidade, `onDelete`)
- [ ] Use cases necessários: Create, Edit, Delete, FindAll, FindById, UpdateStatus, Activate/Deactivate?
- [ ] É módulo simples (só DAO) ou DDD (Entity + Factory + Repository)?
- [ ] Filtros e busca em FindAll (campos)
- [ ] Rotas necessárias em admin e/ou user
- [ ] Claims a registrar (`<X>_READ`, `<X>_WRITE`)

➡️ Aciona: skill **`module-structure`** para decidir simples vs DDD.

#### 1. Schema Prisma

- [ ] Criar `prisma/schema/<modulo>.prisma` com `model <PascalCase> { … @@map("<plural_snake>") }`
- [ ] Campos `id`, `createdAt`, `updatedAt` (e `active` se for toggle)
- [ ] Relações com `onDelete` adequado
- [ ] Relação inversa nos models pais
- [ ] Adicionar `<camelCase>.deleteMany()` em `PrismaService.truncate()` na ordem correta
- [ ] Rodar `npm run db:migration` para sincronizar com o banco de dev
- [ ] (se aplicável) criar seed em `prisma/seeds/<modulo>.ts` e adicionar em `prisma/seeds/index.ts`

➡️ Aciona: skill **`prisma-conventions`**.

#### 2. Tokens DI

- [ ] Adicionar em `src/core/di/token.ts`:
  ```ts
  <ModuleName>Dao: Symbol.for('<ModuleName>Dao'),
  // se DDD:
  <ModuleName>Repository: Symbol.for('<ModuleName>Repository'),
  ```

➡️ Aciona: skill **`dependency-injection`**.

#### 3. Estrutura de pastas e arquivos

- [ ] Criar `src/app/<contexto>/<modulo>/` (ou usar `npm run generate:module <nome>` como ponto de partida)
- [ ] Criar subpastas `domain/`, `application/`, `infra/`
- [ ] Arquivos básicos:
  - `<modulo>.module.ts`
  - `domain/errors/<modulo>-not-found.error.ts`
  - `application/dtos/<modulo>.dto.ts` (DTO de saída do agregado)
  - `application/persistence/<modulo>-persistence.module.ts`
  - `application/persistence/dao/<modulo>-dao.interface.ts`
  - `infra/driven/persistence/prisma/<modulo>-prisma.dao.ts`
  - `infra/drivers/http/admin/<modulo>-admin.controller.ts` (e `user/` se necessário)

➡️ Aciona: skills **`module-structure`** e **`naming-conventions`**.

#### 4. Domínio (apenas se DDD)

- [ ] `domain/entities/<modulo>.entity.ts` com `_instantiate` static + construtor private
- [ ] `domain/factories/<modulo>.factory.ts` com `create/edit/load`
- [ ] VOs específicos em `domain/value-objects/` (se necessário)
- [ ] Erros adicionais em `domain/errors/`

➡️ Aciona: skill **`domain-modeling`**.

#### 5. DTOs

- [ ] `<Module>Dto` no `application/dtos/<modulo>.dto.ts` (sem decorators)
- [ ] `Create<Module>InputDto` em `application/usecases/create-<modulo>/dtos/`
  - `class-validator` + `@Trim`/`@StringToNumber`/`@StringToBoolean`
  - Mensagens em pt-BR com `$property`
  - `@MaxLength` casando com `@db.VarChar(N)` ou limite definido
  - `@ApiProperty({ example: '...' })` em cada campo
- [ ] `Edit<Module>InputDto extends PartialType(Create<Module>InputDto)`
- [ ] `FindAll<Module>QueryDto extends Queries` (+ filtros específicos)
- [ ] Specs `*.dto.spec.ts` com `validateSync` ou `ValidationPipe`

➡️ Aciona: skill **`dto-and-validation`**.

#### 6. Use cases

Para cada operação:
- [ ] `application/usecases/<verbo>-<modulo>/<verbo>-<modulo>.service.ts` com `@Injectable` + `execute(...)`
- [ ] DTOs de input/output em `dtos/`
- [ ] Spec unit `*.service.spec.ts` (com `createMock<I>()`)
- [ ] Spec integration `*.service.integration.spec.ts` (banco real + truncate)

Use cases padrão: `Create`, `Edit`, `Delete`, `FindAll`, `Find<X>ById`, `UpdateXStatus` (toggle) ou `Activate`/`Deactivate`.

➡️ Aciona: skills **`use-case-creation`** e **`testing-strategy`**.

#### 7. Persistência (DAO ± Repository)

- [ ] `application/persistence/dao/<modulo>-dao.interface.ts` com assinaturas canônicas (`findAll`/`findById`/`save`/`edit`/`delete`/`updateStatus`)
- [ ] `infra/driven/persistence/prisma/<modulo>-prisma.dao.ts`
  - Constante `<X>Select satisfies Prisma.<X>Select` no topo
  - `paginationFactory(page, size)` + `$transaction([findMany, count])`
  - Where com **array `conditions[]` + `AND`** (ver rule `dao-where-pattern`)
  - Search com `contains: search.trim(), mode: 'insensitive'`
- [ ] (DDD) `application/persistence/repository/<modulo>-repository.interface.ts` com `save(entity)`, `edit(entity)`, `findById(id)`
- [ ] (DDD) `infra/driven/persistence/prisma/<modulo>-prisma.repository.ts` reidratando via Factory
- [ ] Spec do DAO `<modulo>-prisma.dao.spec.ts`

➡️ Aciona: skills **`dao-pattern`** e **`repository-pattern`**.

#### 8. Persistence Module

- [ ] `application/persistence/<modulo>-persistence.module.ts`:
  ```ts
  const adapters = [
    { provide: TOKENS.<X>Dao, useClass: <X>DaoAdapterPrisma },
    // se DDD:
    { provide: TOKENS.<X>Repository, useClass: <X>RepositoryAdapterPrisma },
  ];
  ```
- [ ] `imports: [DatabaseModule]`, `providers: [...adapters]`, `exports: [...adapters]`

➡️ Aciona: skill **`dependency-injection`**.

#### 9. Controllers

- [ ] `infra/drivers/http/admin/<modulo>-admin.controller.ts` com path `'admin/<modulo>'` + `@RequiredRoles(AccountRole.ADMIN)`
- [ ] Métodos canônicos com `@RequiredClaims(Claim.<X>_*)` + `@Swagger({ ... })`
- [ ] Ordem das rotas: `:id/status` antes de `:id`
- [ ] (se houver leitura pública) `infra/drivers/http/user/<modulo>-user.controller.ts` com path `'user/<modulo>'`
- [ ] Specs `*-admin.controller.spec.ts` e `*-user.controller.spec.ts`

➡️ Aciona: skills **`controllers-and-swagger`** e **`authentication-and-authorization`**.

#### 10. Autorização

- [ ] Adicionar subject em `src/app/authentication/domain/authorization/claim-subject.enum.ts`
- [ ] Adicionar claims em `src/app/authentication/domain/authorization/claim.ts` (`<X>_READ`, `<X>_WRITE`)
- [ ] Para admins existentes que devem ter acesso, adicionar via UI ou seed (`prisma/seeds/account-claims.ts`)

➡️ Aciona: skill **`authentication-and-authorization`**.

#### 11. Module raiz da feature

- [ ] `<modulo>.module.ts` declara `imports`, `controllers`, `providers`, `exports`:
  ```ts
  @Module({
    imports: [
      <Module>PersistenceModule,
      AuthenticationGuardsModule,
    ],
    controllers: [<Module>AdminController, <Module>UserController],
    providers: [Create<X>, Edit<X>, Delete<X>, FindAll<X>, Find<X>ById, ...],
    exports: [Find<X>ById],     // só o que outros módulos vão consumir
  })
  ```

#### 12. Registro global

- [ ] Importar em `src/app.module.ts` (ou no agregador, se for sub-módulo de `client/`, `service/`, `resale/`)

#### 13. Erros tipados

- [ ] Erros de domínio em `domain/errors/`:
  - `<X>NotFoundError` (404)
  - `<X>AlreadyExistsError` (409) se houver unicidade
  - Outros conforme regras
- [ ] Reuse `DocumentAlreadyTakenError`, `EmailAlreadyTakenError`, `ExternalApiError` quando aplicável

➡️ Aciona: skill **`error-handling`**.

#### 14. Testes

- [ ] Cada use case: unit (`*.spec.ts`) + integration (`*.integration.spec.ts`)
- [ ] DAO: integration (`*.dao.spec.ts`)
- [ ] DTOs: validação (`*.dto.spec.ts`)
- [ ] Controllers: smoke spec
- [ ] Rodar `npm test` e garantir que passa
- [ ] Cobertura mínima: feliz + 1 caso de erro por use case

➡️ Aciona: skill **`testing-strategy`**.

#### 15. Documentação

- [ ] Toda rota tem `@Swagger({...})` com `summary` em pt-BR e respostas declaradas
- [ ] (opcional) Regenerar coleção Postman: `npm run generate:postman`

#### 16. Revisão final

- [ ] `npm run lint` passa sem erros
- [ ] `npm test` passa
- [ ] `npm run build` compila
- [ ] Diff revisado: todos os arquivos seguem convenções de naming, ESLint e arquitetura
- [ ] `truncate()` foi atualizado com a nova tabela

## Convenções Obrigatórias

- Seguir **a ordem do checklist**: schema → tokens → estrutura → domínio → DTOs → use cases → persistência → controllers → autorização → módulo → registro → testes
- Não pular passos; cada um previne uma classe de bug
- Ao terminar, **valide localmente**: `npm run lint && npm test`
- Sempre referenciar a **skill correspondente** quando estiver em dúvida em um passo específico

## Anti-Padrões (Nunca Faça)

- ❌ Pular o passo de `truncate()` ⇒ todos os integration tests quebram silenciosamente
- ❌ Adicionar tokens em outro lugar que não `core/di/token.ts`
- ❌ Esquecer claims novas. Sem claim → CASL nega tudo (fail-closed) e a UI quebra
- ❌ Implementar use case antes do DAO/Repository. Comece pelos ports
- ❌ Implementar controller antes do use case. Controller só **expõe** o use case
- ❌ Pular testes "para depois". Por convenção, todo use case nasce com seus dois specs
- ❌ Esquecer de importar o módulo no `app.module.ts` (ou no agregador). O módulo silenciosamente "não existe" e ninguém consome
- ❌ Misturar admin e user no mesmo controller. Sempre dois arquivos
- ❌ Reusar DAO de outro módulo. Importe o **`Module`** e injete o use case **exportado**

## Exemplo Completo

Linha do tempo de uma feature ("FAQ" como referência canônica):

1. **Schema**: `prisma/schema/faq.prisma` com `model Faq { id, question, answer, active, createdAt, updatedAt @@map("faqs") }`
2. **Token**: `TOKENS.FaqDao: Symbol.for('FaqDao')` em `core/di/token.ts`
3. **Pastas**: `src/app/faq/{domain,application,infra}` (gerado via `npm run generate:module faq` e ajustado)
4. **DTO de saída**: `application/dtos/faq.dto.ts` com `class FaqDto`
5. **Port**: `application/persistence/dao/faq-dao.interface.ts` com `IFaqDao`
6. **Adapter Prisma**: `infra/driven/persistence/prisma/faq-prisma.dao.ts` implementando `IFaqDao`
7. **Persistence module**: `application/persistence/faq-persistence.module.ts` ligando token → adapter
8. **Use cases**: 6 services (`CreateFaq`, `FindAllFaq`, `FindFaqById`, `EditFaq`, `UpdateFaqStatus`, `DeleteFaq`)
9. **Erros**: `domain/errors/faq-not-found.error.ts` (`FaqNotFoundError` extends AppException)
10. **Controllers**: `infra/drivers/http/admin/faq-admin.controller.ts` (admin, com `@RequiredClaims(Claim.FAQ_READ|FAQ_WRITE)`) + `infra/drivers/http/user/faq-user.controller.ts` (público)
11. **Claims**: adicionado `Faq` em `claim-subject.enum.ts` e `FAQ_READ`/`FAQ_WRITE` em `claim.ts`
12. **Module**: `faq.module.ts` agregando tudo
13. **Registro**: import em `src/app.module.ts`
14. **Truncate**: `tx.faq.deleteMany()` em `PrismaService.truncate()`
15. **Testes**: 6 services × 2 specs (unit + integration) + DTOs + DAO

Resultado: `~30 arquivos` para uma feature CRUD de 6 use cases. **Use o gerador `npm run generate:module <nome>`** para o scaffolding inicial e ajuste conforme as skills.
