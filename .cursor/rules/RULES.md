# Rules de Arquitetura — dpasis_api

> Estas rules devem ser consultadas antes de qualquer geração de código novo.
> Elas representam a fonte de verdade sobre como este projeto deve evoluir.
>
> Estilo: NestJS 10 + Prisma 5 (schemaFolder) + Hexagonal (Ports & Adapters) com nomenclatura `drivers`/`driven` + DDD-light em módulos com regra de negócio rica + CASL para autorização. Sem CQRS, sem domain events, sem MediatR.

---

## Rule 1 — Respeito às Camadas

O projeto tem 3 camadas por feature: `domain/`, `application/`, `infra/`. As setas de dependência apontam **de fora para dentro**:

```
infra/drivers (controllers HTTP)
        ↓
   application (use cases, DTOs, ports)
        ↓                  ↑
   domain (entities, factories, VOs, errors)
                            │
                  infra/driven (Prisma, gateways)
                  implementa os ports
```

Regras absolutas:
- `domain/` **nunca** importa de `application/` nem de `infra/`
- `domain/` **nunca** importa `@nestjs/...`, `@prisma/...`, `class-validator`, `class-transformer`
- `application/` importa de `domain/` e de `core/` (tokens, DTOs base, exceções base)
- `application/persistence/dao/` e `application/persistence/repository/` declaram **apenas interfaces** (ports)
- `infra/driven/persistence/prisma/` implementa os ports usando `@prisma/client`
- `infra/drivers/http/` consome **use cases** via DI; nunca DAO direto
- Nenhum módulo de feature importa o **DAO** de outro módulo. Importe o **`Module`** e injete o use case **exportado**

---

## Rule 2 — Criação de Entidades

Aplica-se apenas a módulos DDD-light (com entidade rica). Em CRUD simples, **não crie entidade** — use só DTO.

```typescript
// src/app/<modulo>/domain/entities/<modulo>.entity.ts

export type <X>Props = <X>CreateProps & {
  id: number;
  /* campos derivados/persistidos */
};

export type <X>CreateProps = {
  /* campos obrigatórios na criação */
};

export class <X> {
  private readonly _props: <X>Props;

  static _instantiate(props: <X>Props): <X> {
    return new <X>(props);
  }

  private constructor(props: <X>Props) {
    this._props = props;
  }

  public get props(): Readonly<<X>Props> {
    return { ...this._props };   // CÓPIA, não referência
  }

  public <métodoDeNegocio>(): void { /* ... */ }
}
```

Obrigatório:
- Construtor `private`
- `_instantiate` static (único ponto de criação além da Factory)
- `props` retorna **cópia** (`{ ...this._props }`)
- Métodos de negócio mutam `_props` internamente
- Invariantes lançam erros tipados de `domain/errors/`

Exemplo real: `src/app/admin/domain/entities/admin.entity.ts`.

---

## Rule 3 — Criação de Use Cases / Application Services

Todo use case segue:

```typescript
// src/app/<modulo>/application/usecases/<verbo>-<modulo>/<verbo>-<modulo>.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { I<Modulo>Dao } from '../../persistence/dao/<modulo>-dao.interface';
import { <Verbo><Modulo>InputDto, <Verbo><Modulo>OutputDto } from './dtos/<verbo>-<modulo>.dto';

@Injectable()
export class <Verbo><Modulo> {
  constructor(
    @Inject(TOKENS.<Modulo>Dao) private readonly dao: I<Modulo>Dao,
    /* outras deps */
  ) {}

  public async execute(/* args */): Promise<<Verbo><Modulo>OutputDto | SuccessMessage> {
    /* orquestração */
  }
}
```

Obrigatório:
- Classe **`<Verbo><Entity>`** (sem sufixo `Service`/`UseCase`)
- Arquivo **`<verbo>-<modulo>.service.ts`** (kebab-case)
- `@Injectable()` + único método público `execute(...)`
- Ports injetados via `@Inject(TOKENS.X)` + `import type` da interface
- Use cases concretos de outros módulos: injetar **diretamente pelo construtor** (precisa do `exports` no módulo origem)
- DTO de input nomeado **`<Verbo><Entity>InputDto`**, output **`<Verbo><Entity>OutputDto`** ou `SuccessMessage`
- **Retorne sempre DTO** (nunca entidade do domínio)
- Listagem usa `new Pagination(rows, total, queries.page, queries.size).getDto()`

---

## Rule 4 — Repositórios e DAOs

O projeto tem **dois ports** que coexistem nos módulos DDD:

| | DAO (sempre) | Repository (só DDD) |
|---|---|---|
| Onde | `application/persistence/dao/` | `application/persistence/repository/` |
| Implementação | `infra/driven/persistence/prisma/<x>-prisma.dao.ts` | `infra/driven/persistence/prisma/<x>-prisma.repository.ts` |
| Retorno | `XxxDto`, `XxxDto[]`, `[XxxDto[], number]`, `null` | `Xxx` (entidade) ou `null` |
| Métodos | `findAll`, `findById`, `findBy<X>`, `save`/`edit`/`delete`/`updateStatus` (em CRUD simples) | `save(entity)`, `edit(entity)`, `findById` (reidrata via Factory), `delete` |
| Token | `TOKENS.<X>Dao` | `TOKENS.<X>Repository` |

Nomenclatura:
- Interface: **`I<Entity>Dao`** / **`I<Entity>Repository`**
- Adapter Prisma: **`<Entity>DaoAdapterPrisma`** / **`<Entity>RepositoryAdapterPrisma`**

DAO obrigatórios:
- Constante `<Entity>Select satisfies Prisma.<Entity>Select` no topo do adapter
- Where montado com array `conditions: Prisma.<X>WhereInput[]` + `AND` (ver `.cursor/rules/dao-where-pattern.mdc`)
- Search com `contains: search.trim(), mode: 'insensitive'`
- `findAll`: `findMany` + `count` em `$transaction([...])`
- Pagination via `prisma.paginationFactory(page, size)`
- Em DDD, DAO **não tem** `save/edit/delete`; eles vão no Repository

Repository obrigatórios:
- Operações multi-tabela em `prisma.$transaction(async(tx) => …)`
- `findById` reidrata via `<Entity>Factory.load(props)` — nunca instancie a entidade direto
- `save(entity)` retorna o `id`; `edit(entity)` retorna `void`

Tokens vão **exclusivamente** em `src/core/di/token.ts` como `Symbol.for('<Nome>')`.

---

## Rule 5 — Testes

Co-locação obrigatória (ao lado do código, sem pasta `__tests__/`):

| Sufixo | Tipo | Estratégia |
|---|---|---|
| `*.spec.ts` | **Unit** | Mocks via `createMock<I>()` do `@golevelup/ts-jest` |
| `*.integration.spec.ts` | **Integration** | `Test.createTestingModule({ imports: [<X>Module] })` + `prisma.truncate()` |
| `<x>-prisma.dao.spec.ts` | **DAO** | Banco real |
| `<x>.dto.spec.ts` | **DTO** | `validateSync` ou `ValidationPipe` real |

Padrões obrigatórios:
- `describe('<Sujeito> - Unit tests' | '<Sujeito> - Integration tests', …)`
- `let sut: <Class>` (variável universal)
- Helper `make<Verbo><Entity>Input(overrides = {}): <X>InputDto` no topo
- Triple-A com comentários `// Arrange`, `// Act`, `// Assert`
- Primeiro `it`: `should be defined`
- Integration: `beforeEach(prisma.truncate)` + `afterAll(prisma.truncate + $disconnect)`
- Não use `Promise.all` em integration tests com unique constraints
- Use cases reais (não mockados) em integration tests; gateways reais usam fakes via `NODE_ENV=test`

---

## Rule 6 — Eventos de Domínio

**O projeto NÃO usa domain events.** A orquestração entre módulos é feita por:

1. **Imports diretos** de módulos (com `forwardRef` se houver ciclo)
2. **Reuso de use cases** exportados pelo módulo origem (`exports: [Find<X>ById]`)
3. **Saga compensatória manual** (try/catch + rollback explícito) quando uma operação cruza módulos

Não introduza barramento de eventos, MediatR, EventEmitter, etc., sem alinhamento prévio. Se a orquestração ficou complexa, prefira **um use case orquestrador** que injeta os outros.

Exemplo real: `CreateClient` chama `CreateClientAddress` em try/catch e rolla back via `clientRepository.delete(id)` se falhar (`src/app/client/client/application/usecases/create-client/create-client.service.ts`).

---

## Rule 7 — Tratamento de Erros

Padrão **único**: `AppException`. Sem Result/Either.

```typescript
// src/app/<modulo>/domain/errors/<razão>.error.ts

import { AppException } from 'src/core/filters/app.exception';

export class <Razão>Error extends AppException {
  constructor(/* args */) {
    super('<mensagem em pt-BR>', <statusCode>);
    this.name = '<Razão>Error';
  }
}
```

Códigos HTTP canônicos:

| Código | Quando |
|---|---|
| `400` | (default — omitir o código) Bad request, validação cruzada |
| `404` | Entidade não encontrada |
| `409` | Conflito (email/documento já em uso, sequência tomada) |
| `503` | API externa fora do ar (`ExternalApiError`) |

Filter global (`HttpExceptionFilter`) captura `AppException`, sanitiza body (campos sensíveis viram `****`), loga via `ILoggerGateway` e responde `{ message: string }` com o status code.

Proibido:
- ❌ `throw new HttpException(...)`, `BadRequestException`, `NotFoundException`, etc.
- ❌ `throw new Error('...')` direto (sempre tipo concreto extendendo `AppException`)
- ❌ Mensagens em inglês para o usuário final
- ❌ Lançar erro de domínio dentro do DAO (deixe o use case decidir)

Erros transversais ficam em `src/shared/errors/` (ex.: `DocumentAlreadyTakenError`, `EmailAlreadyTakenError`, `ExternalApiError`).

---

## Rule 8 — DTOs e Contratos

DTOs são **classes** (não interfaces), pois `class-validator` precisa dos decorators em runtime.

Localização:
- DTO de saída do agregado: **`application/dtos/<modulo>.dto.ts`** (sem decorators)
- DTOs do use case: **`application/usecases/<verbo>-<modulo>/dtos/<verbo>-<modulo>.dto.ts`**

Convenções:
- Input: **`<Verbo><Entity>InputDto`**
- Output específico: **`<Verbo><Entity>OutputDto`** (ou `SuccessMessage` para mutações simples)
- Query: **`FindAll<Entity>QueryDto extends Queries`**
- Param genérico: usar **`Params`** do `src/infra/validators/class/dtos/params/params.dto.ts`
- Param com `clientId`: usar **`ParamsClientId`**
- Edit DTO: **`PartialType(Create<Entity>InputDto)`** (do `@nestjs/swagger`)

Validação obrigatória:
- Mensagens em pt-BR com `$property`
- `@Trim()` em strings
- `@StringToNumber()` antes de `@IsInt`/`@IsPositive` para query/path
- `@StringToBoolean()` antes de `@IsBoolean` para query
- `@MaxLength` casando com `@db.Text`/`@db.VarChar(N)` do schema
- `@ApiProperty({ example: '...' })` ou `@ApiPropertyOptional()` em cada campo

DTOs de saída do agregado **não têm decorators** — são apenas shape.

---

## Rule 9 — Adição de Dependências Externas

Toda integração externa segue o padrão **Gateway** em `src/infra/<x>/`:

```
src/infra/<x>/
├── <x>.gateway.ts                # interface IxxxGateway (port)
├── <x>.module.ts                 # XxxModule.register() (DynamicModule)
├── dtos/<x>.dto.ts               # DTO normalizado
├── adapters/
│   ├── fake/<x>-fake.gateway.ts                     # SEMPRE existe
│   └── <tecnologia>/<x>-<tecnologia>.gateway.ts     # adapter real
```

Regras:
- Lib externa (`redis`, `bullmq`, `axios`, `@aws-sdk/client-s3`) **só** dentro de `infra/<x>/adapters/<tecnologia>/`
- Toda integração externa **deve ter um adapter fake** (usado em testes via `NODE_ENV=test`)
- Module usa `static register(): DynamicModule`, escolhe `useClass: isTest ? FakeAdapter : RealAdapter`
- Adapter real captura erros e lança `ExternalApiError` (`src/shared/errors/external-api.error.ts`)
- Adapter real loga via `ILoggerGateway` antes de re-lançar
- DTO retornado é **independente da tecnologia** (mapear no adapter real)
- Token em `src/core/di/token.ts` como `<Categoria>Gateway: Symbol.for('<Categoria>Gateway')`

`@Global()` apenas para gateways realmente cross-cutting (cache, logger).

---

## Rule 10 — Checklist para Nova Funcionalidade

Antes de implementar qualquer nova funcionalidade, confirme **na ordem**:

- [ ] **Schema Prisma** criado em `prisma/schema/<modulo>.prisma` (singular + `@@map` plural snake_case)
- [ ] **`PrismaService.truncate()`** atualizado com `tx.<camelCase>.deleteMany()` na ordem correta de FK
- [ ] **Tokens DI** adicionados em `src/core/di/token.ts` (`<X>Dao`, `<X>Repository` se DDD)
- [ ] **Estrutura `domain/application/infra`** criada (use `npm run generate:module <nome>` como ponto de partida)
- [ ] **Domínio modelado** (entity + factory em DDD; só erros em CRUD simples)
- [ ] **Ports definidos**: `IxxxDao` (sempre) + `IxxxRepository` (DDD) em `application/persistence/`
- [ ] **DTOs do use case** com validação pt-BR + decorators custom (`@Trim`, `@StringToNumber`, `@StringToBoolean`)
- [ ] **DTOs do agregado** em `application/dtos/<modulo>.dto.ts` (sem decorators)
- [ ] **Adapter Prisma** com `<X>Select satisfies Prisma.<X>Select` + padrão `conditions[]`/`AND` + `paginationFactory` + `$transaction`
- [ ] **Persistence module** `<modulo>-persistence.module.ts` ligando token → adapter
- [ ] **Use cases** com `@Injectable() + execute(...)` e DTOs nomeados corretamente
- [ ] **Erros tipados** estendendo `AppException` em `domain/errors/` ou reusando `src/shared/errors/`
- [ ] **Controllers** separados por canal (`admin/`, `user/`) com `@RequiredRoles + @RequiredClaims + @Swagger`
- [ ] **Claim subjects/actions** registrados em `src/app/authentication/domain/authorization/claim-subject.enum.ts` e `claim.ts`
- [ ] **`<modulo>.module.ts`** declarando imports/controllers/providers/exports
- [ ] **Importado em `src/app.module.ts`** ou no agregador correspondente
- [ ] **Testes**: unit (`*.spec.ts` com `createMock`) + integration (`*.integration.spec.ts` com `prisma.truncate`) para cada use case e DAO; specs de DTO
- [ ] **`npm run lint`** passa
- [ ] **`npm test`** passa
- [ ] **`npm run build`** compila

Se algum item ficou "não aplicável", documente o motivo no PR. Pular passos sem justificativa é fonte recorrente de bugs e CI quebrado.

---

## Referências

- Skills detalhadas por tópico: `.cursor/skills/<nome-da-skill>/SKILL.md`
- Rule específica do padrão Where: `.cursor/rules/dao-where-pattern.mdc`
- Skill de geração CRUD: `.cursor/skills/crud-module-generator/SKILL.md`
- Skill de CASL: `.cursor/skills/nest-casl/SKILL.md`
- Passaporte arquitetural conciso: `.cursor/context.md`
