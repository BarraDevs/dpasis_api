---
name: dao-pattern
description: >-
  Padrão DAO (Data Access Object) usado para LEITURA e CRUDs simples no
  projeto. Use quando precisar criar/modificar uma interface IxxxDao, criar um
  adapter Prisma (xxx-prisma.dao.ts), entender quando usar DAO vs Repository,
  ou quando o usuário disser "criar DAO", "criar interface de persistência",
  "buscar do banco", "implementar findAll/findById", "como ler dados de X",
  "consulta paginada", "montar where no Prisma", "conditions AND". Inclui o
  padrão obrigatório de montagem do where (array conditions + AND).
---

# Padrão DAO (Data Access Object)

## Contexto

O **DAO é o port de leitura** do projeto. Define operações sobre o banco que retornam **DTOs** (não entidades de domínio). Em módulos simples (sem entidade rica) o DAO também faz escrita (`save/edit/delete/updateStatus`). Em módulos DDD-light, o DAO faz só leitura e a escrita vai pelo `IxxxRepository`.

A interface fica em `application/persistence/dao/` (o port). A implementação Prisma fica em `infra/driven/persistence/prisma/` (o adapter). Bind acontece no `<modulo>-persistence.module.ts`.

## Estrutura e Localização

```
application/
├── dtos/
│   └── <modulo>.dto.ts                                # DTO retornado pelo DAO
├── persistence/
│   ├── <modulo>-persistence.module.ts                 # Binding TOKEN → Adapter
│   └── dao/
│       └── <modulo>-dao.interface.ts                  # Port (IxxxDao)
└── usecases/...                                       # Consumidores

infra/driven/persistence/prisma/
├── <modulo>-prisma.dao.ts                             # Adapter
└── <modulo>-prisma.dao.spec.ts
```

## Como Fazer

### 1) Definir o port (interface)

```1:13:src/app/faq/application/persistence/dao/faq-dao.interface.ts
import { FaqDto } from '../../dtos/faq.dto';
import { CreateFaqInputDto } from '../../usecases/create-faq/dtos/create-faq.dto';
import { EditFaqInputDto } from '../../usecases/edit-faq/dtos/edit-faq.dto';
import { FindAllFaqQueryDto } from '../../usecases/find-all-faq/dtos/find-all-faq.dto';

export interface IFaqDao {
  findAll(queries: FindAllFaqQueryDto): Promise<[FaqDto[], number]>;
  findById(id: number): Promise<FaqDto | null>;
  save(data: CreateFaqInputDto): Promise<number>;
  edit(id: number, data: EditFaqInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
```

Assinaturas canônicas:

| Método | Retorno | Quando usar |
|---|---|---|
| `findAll(queries)` | `Promise<[XxxDto[], number]>` (rows + total) | Listagem com paginação. SEMPRE retorna a tupla |
| `findById(id)` | `Promise<XxxDto \| null>` | Busca 1 por id; o use case decide se lança erro |
| `findBy<Critério>(value)` | `Promise<XxxDto \| null>` ou `Promise<{ id: number } \| null>` | Buscas auxiliares (ex.: `findByEmail`) |
| `save(data)` | `Promise<number>` (o id criado) | Apenas em módulo simples (sem Repository) |
| `edit(id, data)` | `Promise<void>` | Apenas em módulo simples |
| `delete(id)` | `Promise<void>` | Apenas em módulo simples |
| `updateStatus(id, active)` | `Promise<void>` | Toggle de `active` |

### 2) Implementar o adapter Prisma

```1:55:src/app/faq/infra/driven/persistence/prisma/faq-prisma.dao.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FaqDto } from 'src/app/faq/application/dtos/faq.dto';
import { IFaqDao } from 'src/app/faq/application/persistence/dao/faq-dao.interface';
import { CreateFaqInputDto } from 'src/app/faq/application/usecases/create-faq/dtos/create-faq.dto';
import { EditFaqInputDto } from 'src/app/faq/application/usecases/edit-faq/dtos/edit-faq.dto';
import { FindAllFaqQueryDto } from 'src/app/faq/application/usecases/find-all-faq/dtos/find-all-faq.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const FaqSelect = {
  id: true,
  question: true,
  answer: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FaqSelect;

@Injectable()
export class FaqDaoAdapterPrisma implements IFaqDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllFaqQueryDto): Promise<[FaqDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.FaqWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { question: { contains: queries.search.trim(), mode: 'insensitive' } },
          { answer: { contains: queries.search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.FaqWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [faqs, total] = await this.prisma.$transaction([
      this.prisma.faq.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: FaqSelect,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.faq.count({ where }),
    ]);

    return [faqs, total];
  }
```

### 3) Padrão Where nos DAOs Prisma (obrigatório)

Todos os DAOs usam o mesmo padrão para construir o objeto `where` em `findAll`: **array de condições com `AND`**.

#### Estrutura padrão

```typescript
const conditions: Prisma.XWhereInput[] = [];

// 1. Condições obrigatórias (quando existir)
if (queries.clientId != null) {
  conditions.push({ clientId: { equals: queries.clientId } });
}

// 2. Search (OR com contains + mode: 'insensitive')
if (queries.search?.trim()) {
  conditions.push({
    OR: [
      { campo1: { contains: queries.search.trim(), mode: 'insensitive' } },
      { campo2: { contains: queries.search.trim(), mode: 'insensitive' } },
    ],
  });
}

// 3. Filtro active (quando != null && !== undefined)
if (queries.active != null && queries.active !== undefined) {
  conditions.push({ active: queries.active });
}

// 4. Outros filtros específicos do módulo
if (queries.campo != null) {
  conditions.push({ campo: { equals: queries.campo } });
}

const where: Prisma.XWhereInput = conditions.length > 0 ? { AND: conditions } : {};
```

#### Regras de convenção

| Cenário | Padrão |
|---------|--------|
| **Search em múltiplos campos** | `OR: [{ campo: { contains: search.trim(), mode: 'insensitive' } }, ...]` |
| **Search em um único campo** | `{ campo: { contains: search.trim(), mode: 'insensitive' } }` |
| **Search em relacionamentos** | `OR: [{ rel: { campo: { contains, mode } } }, ...]` |
| **Filtro active** | `queries.active != null && queries.active !== undefined` antes de adicionar |
| **Equals simples** | `{ campo: { equals: valor } }` |
| **Equals case-insensitive** | `{ campo: { equals: valor.trim(), mode: 'insensitive' } }` |
| **Where vazio** | `conditions.length > 0 ? { AND: conditions } : {}` |

#### Exemplos por cenário

**Search em múltiplos campos** (ex.: Bank, Company, FAQ):

```typescript
if (queries.search?.trim()) {
  conditions.push({
    OR: [
      { drawer: { contains: queries.search.trim(), mode: 'insensitive' } },
      { bankName: { contains: queries.search.trim(), mode: 'insensitive' } },
    ],
  });
}
```

**Search em um único campo** (ex.: ClientGroup, ClientOwner):

```typescript
if (queries.search?.trim()) {
  conditions.push({
    name: { contains: queries.search.trim(), mode: 'insensitive' },
  });
}
```

**Search em relacionamentos** (ex.: ClientType, ClientItem):

```typescript
if (queries.search?.trim()) {
  conditions.push({
    OR: [
      { clientSystemType: { name: { contains: queries.search.trim(), mode: 'insensitive' } } },
      { clientDescriptionType: { name: { contains: queries.search.trim(), mode: 'insensitive' } } },
    ],
  });
}
```

**Condição obrigatória** (ex.: `clientId` em sub-recursos):

```typescript
const conditions: Prisma.XWhereInput[] = [
  { clientId: { equals: queries.clientId } },
];
```

#### Nomenclatura

- Use `conditions` (não `andConditions`) para o array de condições.
- Sempre use `queries.search?.trim()` para ignorar string vazia.
- Para `active`: `{ active: queries.active }` (não `{ active: { equals: queries.active } }`).

### 4) Constante `Select` no topo do adapter

Sempre declare uma constante `<Entity>Select` com `satisfies Prisma.<Entity>Select` para type-safety e reuso:

```ts
const FaqSelect = {
  id: true,
  question: true,
  answer: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FaqSelect;
```

### 5) Paginação

Use **sempre** `this.prisma.paginationFactory(queries.page, queries.size)` que retorna `{ skip, take }`. Nunca calcule manualmente.

### 6) `findAll` com `$transaction`

`findMany` + `count` devem rodar em `$transaction([...])` para evitar inconsistências de paginação:

```ts
const [rows, total] = await this.prisma.$transaction([
  this.prisma.faq.findMany({ where, skip, take, select: FaqSelect, orderBy: {...} }),
  this.prisma.faq.count({ where }),
]);
```

### 7) Mapeamento DTO ↔ Prisma

Quando os tipos divergem (ex.: enums armazenados como `String`), faça o cast/mapper no adapter:

```60:75:src/app/account/infra/driven/persistence/prisma/account-prisma.dao.ts
  public async findById(id: number): Promise<AccountDto | null> {
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: AccountSelect,
    });
    if (!account) {
      return null;
    }

    return {
      ...account,
      status: account.status as AccountStatus,
      role: account.role as AccountRole,
    };
  }
```

Em adapters mais complexos use uma função `mapToDto(row): XxxDto` no topo (padrão visto em `admin-prisma.dao.ts`).

### 8) Adapter de DAO em módulo DDD (apenas leitura)

Em módulo DDD, o DAO **não tem `save/edit/delete`** — esses ficam no Repository:

```1:11:src/app/admin/application/persistence/dao/admin-dao.interface.ts
import { AdminDto, AdminWithClaimsDto } from '../../dtos/admin.dto';
import { FindAllAdminQueryDto } from '../../usecases/find-all-admin/dtos/find-all-admin.dto';

export interface IAdminDao {
  findAll(queries: FindAllAdminQueryDto): Promise<[AdminDto[], number]>;
  findById(id: number): Promise<AdminDto | null>;
  findByIdWithClaims(id: number): Promise<AdminWithClaimsDto | null>;
  findByDocument(document: string): Promise<{ id: number } | null>;
  findByEmail(email: string): Promise<{ id: number } | null>;
}
```

## Convenções Obrigatórias

- Interface nomeada **`I<Entity>Dao`** em `application/persistence/dao/<modulo>-dao.interface.ts`
- Implementação nomeada **`<Entity>DaoAdapterPrisma`** em `infra/driven/persistence/prisma/<modulo>-prisma.dao.ts`
- Adapter SEMPRE `@Injectable()` e injeta `PrismaService` direto pelo construtor (sem token, pois é classe concreta)
- DAO retorna **DTO**, nunca entidade do domínio
- `findAll` SEMPRE retorna `Promise<[<Dto>[], number]>` (tupla rows + total)
- `findById` SEMPRE retorna `Promise<<Dto> | null>` — o use case decide se lança 404
- Where montado com array `conditions: Prisma.XWhereInput[]` + `AND` (secção 3 desta skill)
- Pagination via `prisma.paginationFactory(page, size)`
- Search com `contains: search.trim(), mode: 'insensitive'`
- `findMany` + `count` em `$transaction`

## Anti-Padrões (Nunca Faça)

- ❌ Retornar `Prisma.XxxGetPayload<...>` ou tipo gerado pelo Prisma do DAO. Sempre mapeie para `<Entity>Dto`
- ❌ Construir o `where` com objetos espalhados em vez de array `conditions`
- ❌ `where: { ...filtros, ...(search ? { OR: ... } : {}) }` — não segue o padrão. Use `AND: conditions`
- ❌ Esquecer `mode: 'insensitive'` no search (UX ruim com busca case-sensitive)
- ❌ `findMany` sem `$transaction` junto com `count` (paginação inconsistente)
- ❌ `findMany` sem `select` ou `include` específico — sempre use `<Entity>Select satisfies Prisma.<Entity>Select`
- ❌ Em módulo DDD, ter `save/edit/delete` no DAO (eles vão no Repository)
- ❌ Acessar o `prisma` de outro módulo. Cada módulo é dono do seu adapter

## Exemplo Completo

DAO completo do FAQ — referência canônica de módulo simples:

```56:91:src/app/faq/infra/driven/persistence/prisma/faq-prisma.dao.ts
  public async findById(id: number): Promise<FaqDto | null> {
    return this.prisma.faq.findUnique({
      where: { id },
      select: FaqSelect,
    });
  }

  public async save(data: CreateFaqInputDto): Promise<number> {
    const result = await this.prisma.faq.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditFaqInputDto): Promise<void> {
    await this.prisma.faq.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.faq.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.faq.update({
      where: { id },
      data: { active },
    });
  }
```
