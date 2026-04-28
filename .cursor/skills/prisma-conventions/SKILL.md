---
name: prisma-conventions
description: >-
  Convenções Prisma do projeto: schemaFolder multi-arquivo, model singular
  com @@map plural snake_case, paginationFactory, $transaction,
  PrismaService.truncate(). Use ao adicionar/modificar uma model Prisma,
  ao criar um arquivo .prisma novo, ao escrever queries no adapter, ao
  fazer migration (prisma db push), ao atualizar o truncate, ou quando o
  usuário disser "schema Prisma", "migration", "prisma db push", "model",
  "tabela", "@@map", "schemaFolder", "FK", "onDelete", "transaction", "seed".
---

# Convenções Prisma

## Contexto

O projeto usa **Prisma 5.22 com `previewFeatures = ["prismaSchemaFolder"]`** — o schema é fragmentado em múltiplos arquivos `.prisma` em `prisma/schema/`. Não há `prisma migrate`; usa-se **`prisma db push`** + seeds.

`PrismaService` (`src/infra/database/prisma/prisma.service.ts`) estende `PrismaClient`, é `@Global` via `DatabaseModule`, e expõe utilitários extras:
- `paginationFactory(page?, size?)` → `{ skip, take }`
- `truncate()` → limpa tabelas em ordem correta de FK (para testes)

## Estrutura e Localização

```
prisma/
├── schema/
│   ├── schema.prisma                # generator + datasource (apenas)
│   ├── id.prisma                    # tipo de id customizado, se houver
│   ├── account.prisma               # model Account + AccountClaim
│   ├── admin.prisma
│   ├── audit.prisma                 # AuditLog
│   ├── bank.prisma
│   ├── client-type.prisma
│   ├── client.prisma                # Client + sub-models do agregado
│   ├── company.prisma
│   ├── faq.prisma
│   ├── global.prisma                # billed, category, freight, ...
│   ├── resale.prisma
│   ├── service.prisma
│   ├── taxation.prisma
│   └── text.prisma
└── seeds/
    ├── index.ts                     # Orquestrador
    ├── account-claims.ts
    ├── admin.ts
    ├── ...
```

Configuração do `package.json`:

```json
"prisma": {
  "schema": "./prisma/schema",
  "seed": "dotenv -e .env.development -- ts-node prisma/seeds/index.ts"
}
```

`schema.prisma` raiz só declara generator + datasource:

```1:10:prisma/schema/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["prismaSchemaFolder"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Como Fazer

### 1) Adicionar uma model nova

Crie `prisma/schema/<modulo>.prisma`:

```1:10:prisma/schema/faq.prisma
model Faq {
  id        Int      @id @default(autoincrement())
  question  String   @db.Text
  answer    String   @db.Text
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("faqs")
}
```

Convenções da model:

| Convenção | Exemplo |
|---|---|
| Nome do model | **PascalCase singular** (`Faq`, não `Faqs`) |
| Nome da tabela | **`@@map("<plural_snake_case>")`** (`faqs`, `client_attachments`) |
| Id padrão | `id Int @id @default(autoincrement())` |
| Id customizado (cliente externo controla) | `id Int @id` (sem default) — ver `Client` |
| Strings curtas | `String` (Postgres `text`) |
| Strings longas | `String @db.Text` |
| Strings de tamanho fixo | `String @db.VarChar(N)` |
| Boolean default | `active Boolean @default(true)` |
| Timestamps | `createdAt DateTime @default(now())` + `updatedAt DateTime @updatedAt` |
| Unique simples | `name String @unique` |
| Unique composto | `@@unique([clientId, type])` |
| Index | `@@index([link])` |

### 2) Relação 1-N com `onDelete`

```65:78:prisma/schema/client.prisma
model ClientAttachment {
  id          Int      @id @default(autoincrement())
  clientId    Int
  description String   @db.Text
  link        String   @db.Text
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([link])
  @@map("client_attachments")
}
```

`onDelete` válidos no projeto: `Cascade`, `SetNull`, `Restrict` (default). Escolha conforme o domínio.

### 3) Relação 1-1

```12:15:prisma/schema/account.prisma
  admin  Admin?
  claims AccountClaim[]

  @@unique([id, role])
```

E no Admin:

```typescript
model Admin {
  accountId Int     @id           // FK como PK
  account   Account @relation(fields: [accountId], references: [id])
  // ...
}
```

### 4) Enum como String

O projeto guarda enums **como `String` no banco** (não usa `enum` do Prisma) — facilita evolução e mapeamento para enum TS:

```5:9:prisma/schema/account.prisma
  role               String
  // ...
  status             String
```

No DAO, faça o cast:

```typescript
return {
  ...account,
  status: account.status as AccountStatus,
  role: account.role as AccountRole,
};
```

### 5) Sequência de update em `truncate()`

Ao adicionar nova tabela, **atualize `PrismaService.truncate()`** colocando-a na ordem correta de FK (filha antes de pai). Adicione um comentário explicando dependências:

```22:69:src/infra/database/prisma/prisma.service.ts
  public async truncate() {
    await this.$transaction(async(tx) => {
      // Audit logs (sem dependências)
      await tx.auditLog.deleteMany();
      // 0. ClientInvoiceConfig (referencia Client, ClientAddress, Bank)
      await tx.clientInvoiceConfig.deleteMany();
      // 0.1 ClientDiscount (referencia Client)
      await tx.clientDiscount.deleteMany();
      // 1. Tabelas que referenciam Client
      await tx.clientType.deleteMany();
      await tx.clientAddress.deleteMany();
      await tx.clientContact.deleteMany();
      // ...
    });
  }
```

⚠️ **Esquecer de adicionar a nova tabela aqui quebra todos os testes de integração** (com FK violation no truncate).

### 6) `paginationFactory`

```14:19:src/infra/database/prisma/prisma.service.ts
  public paginationFactory(page?: number, size?: number) {
    return {
      skip: (page && size) ? ((page - 1) * size) : undefined,
      take: (page && size) ? size : undefined,
    };
  }
```

Comportamento: se `page` ou `size` for `undefined`, retorna `{ skip: undefined, take: undefined }` ⇒ Prisma traz tudo sem paginar. **Sempre use no DAO**.

### 7) `$transaction`

Para operações multi-tabela, **use SEMPRE `prisma.$transaction`**:

```typescript
// Modo A: array de promises (auto-commit/rollback)
await this.prisma.$transaction([
  this.prisma.faq.findMany({ ... }),
  this.prisma.faq.count({ ... }),
]);

// Modo B: callback com tx (controle de fluxo)
await this.prisma.$transaction(async(tx) => {
  const account = await tx.account.create({ ... });
  await tx.admin.create({ data: { accountId: account.id, ... } });
  await tx.accountClaim.createMany({ data: rows });
  return account.id;
});
```

Use **modo A** para `findMany + count` em listagem paginada (consistência). Use **modo B** quando precisa do id de um insert para usar no próximo.

### 8) `Select` constante no topo do adapter

```10:17:src/app/faq/infra/driven/persistence/prisma/faq-prisma.dao.ts
const FaqSelect = {
  id: true,
  question: true,
  answer: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FaqSelect;
```

Vantagens:
- Type-safe via `satisfies Prisma.<Entity>Select`
- Reuso entre `findUnique`/`findMany`
- Garante que campos sensíveis (ex.: `password`) não vazam

Quando há variantes (com claims, com sensitive data), declare `<Entity>WithXSelect` adicional:

```10:22:src/app/account/infra/driven/persistence/prisma/account-prisma.dao.ts
const AccountSelect = {
  id: true,
  role: true,
  name: true,
  email: true,
  status: true,
} satisfies Prisma.AccountSelect;

const AccountWithSensitiveDataSelect = {
  ...AccountSelect,
  password: true,
  passwordResetToken: true,
} satisfies Prisma.AccountSelect;
```

### 9) Migrations

O projeto **não usa** `prisma migrate dev`. Os scripts são:

| Comando | O que faz |
|---|---|
| `npm run db:migration` | `prisma db push` (sincroniza schema com DB sem versionar migration) |
| `npm run db:reset` | Drop + push + seed |
| `npm run db:seed` | Roda seeds |
| `npm run db:studio` | Abre Prisma Studio |

Todos prefixados com `dotenv -e .env.development` — então sempre rodam contra o banco de dev (não de teste).

### 10) Seeds

Cada arquivo em `prisma/seeds/<entity>.ts` exporta uma função; o orquestrador é `prisma/seeds/index.ts`. Seeds rodam em ordem de FK — adicione novos respeitando dependências.

## Convenções Obrigatórias

- Cada bounded context tem seu próprio arquivo `.prisma` em `prisma/schema/<modulo>.prisma`
- Model **PascalCase singular** + `@@map("<plural_snake_case>")` obrigatório
- `id`, `createdAt`, `updatedAt` em toda model (exceto join tables)
- Strings longas com `@db.Text`
- Enums armazenados como `String` (cast para enum TS no DAO)
- `<Entity>Select satisfies Prisma.<Entity>Select` no topo de cada DAO
- `findMany` + `count` em `$transaction([...])`
- Operações multi-tabela em `$transaction(async(tx) => …)`
- Toda nova model adicionada em `PrismaService.truncate()` na ordem correta de FK
- `onDelete` explícito em cada relação (default `Restrict` na maioria; `Cascade` para owners óbvios)

## Anti-Padrões (Nunca Faça)

- ❌ Model em plural (`model Faqs`). Use **singular** + `@@map("plural")`
- ❌ Esquecer `@@map(...)` ⇒ tabela vai para o nome do model em snake_case
- ❌ Usar `enum` do Prisma. Padrão é **`String` + cast no DAO**
- ❌ Usar `prisma migrate`. Use `db push` (decisão consciente do projeto, ainda em fase pré-produção)
- ❌ Esquecer de adicionar a nova tabela em `truncate()` ⇒ todos integration tests quebram
- ❌ Calcular `skip/take` manualmente. Use `paginationFactory`
- ❌ `findMany` sem `select`/`include` ⇒ retorna campos sensíveis
- ❌ Operação multi-tabela fora de `$transaction`
- ❌ Acessar `prismaService` direto do use case. Use sempre via DAO/Repository

## Exemplo Completo

Schema completo do FAQ + DAO consumindo:

`prisma/schema/faq.prisma`:

```1:10:prisma/schema/faq.prisma
model Faq {
  id        Int      @id @default(autoincrement())
  question  String   @db.Text
  answer    String   @db.Text
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("faqs")
}
```

DAO usando `Select` + `paginationFactory` + `$transaction`:

```10:55:src/app/faq/infra/driven/persistence/prisma/faq-prisma.dao.ts
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
