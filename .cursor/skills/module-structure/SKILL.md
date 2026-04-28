---
name: module-structure
description: >-
  Como criar a estrutura de pastas e arquivos de um novo módulo de feature
  (bounded context). Use ao iniciar um módulo CRUD novo, ao adicionar um
  sub-módulo a um agregado existente (como client/, service/, resale/), ao
  decidir entre módulo "simples" (só DAO) e "DDD" (DAO + Repository + Entity +
  Factory), ou quando o usuário pedir "criar módulo X", "novo recurso",
  "começar feature", "scaffold de módulo", "como organizar pastas".
---

# Estrutura de Módulo de Feature

## Contexto

Todo módulo de feature segue a mesma estrutura hexagonal. Existem **dois níveis** de módulo no projeto, escolhidos pela complexidade do domínio:

| Nível | Quando usar | Exemplos no código |
|---|---|---|
| **Simples** | CRUD direto sem regras de negócio (apenas validação de input + persistência) | `faq`, `client-group`, `client-owner`, `bank` |
| **DDD-light** | Há invariantes de domínio, transações multi-tabela, validação que precisa de Entity + Factory + VOs | `admin`, `client`, `resale`, `company`, `service-catalog` |

## Estrutura e Localização

### Módulo Simples (referência: FAQ)

```
src/app/faq/
├── faq.module.ts
├── domain/
│   └── errors/
│       └── faq-not-found.error.ts
├── application/
│   ├── dtos/
│   │   └── faq.dto.ts                              # Output DTO da entidade
│   ├── persistence/
│   │   ├── faq-persistence.module.ts               # Binding TOKEN → Adapter
│   │   └── dao/
│   │       └── faq-dao.interface.ts                # Port (IFaqDao)
│   └── usecases/
│       ├── create-faq/
│       │   ├── create-faq.service.ts
│       │   ├── create-faq.service.spec.ts          # Unit (mocks)
│       │   ├── create-faq.service.integration.spec.ts
│       │   └── dtos/
│       │       ├── create-faq.dto.ts               # Input/Output do use case
│       │       └── create-faq.dto.spec.ts          # Validação via ValidationPipe
│       ├── delete-faq/
│       ├── edit-faq/
│       ├── find-all-faq/
│       ├── find-faq-by-id/
│       └── update-faq-status/
└── infra/
    ├── drivers/
    │   └── http/
    │       ├── admin/
    │       │   ├── faq-admin.controller.ts
    │       │   └── faq-admin.controller.spec.ts
    │       └── user/
    │           ├── faq-user.controller.ts
    │           └── faq-user.controller.spec.ts
    └── driven/
        └── persistence/
            └── prisma/
                ├── faq-prisma.dao.ts               # Implementa IFaqDao
                └── faq-prisma.dao.spec.ts
```

### Módulo DDD-light (referência: Admin)

Adiciona em `domain/`:
- `entities/<modulo>.entity.ts` — entidade rica
- `factories/<modulo>.factory.ts` — `create/edit/load`
- `value-objects/<vo-name>/<vo-name>.vo.ts` (VOs específicos do contexto, se houver)

E em `application/persistence/`:
- `repository/<modulo>-repository.interface.ts` — port para escrever entidade

E em `infra/driven/persistence/prisma/`:
- `<modulo>-prisma.repository.ts` — implementa `Ixxx Repository`

## Como Fazer

### Passo a passo para um módulo CRUD novo

1. **Criar a pasta raiz**: `src/app/<contexto>/<modulo>/` (kebab-case, singular)
2. **Adicionar tokens** em `src/core/di/token.ts`:
   ```ts
   <ModuleName>Dao: Symbol.for('<ModuleName>Dao'),
   // se DDD:
   <ModuleName>Repository: Symbol.for('<ModuleName>Repository'),
   ```
3. **Schema Prisma**: criar `prisma/schema/<modulo>.prisma` com `model <ModuleName> { … @@map("<plural_snake_case>") }` — ver skill `prisma-conventions`
4. **Adicionar `<camelCase>.deleteMany()`** em `PrismaService.truncate()` (`src/infra/database/prisma/prisma.service.ts`) na ordem correta de FK
5. **Criar `domain/errors/<modulo>-not-found.error.ts`** (sempre estende `AppException` com código 404)
6. **Criar DTO de saída** `application/dtos/<modulo>.dto.ts`
7. **Criar port** `application/persistence/dao/<modulo>-dao.interface.ts` com `findAll/findById/save/edit/delete` (e `updateStatus` se aplicável)
8. **Criar adapter Prisma** em `infra/driven/persistence/prisma/<modulo>-prisma.dao.ts`
9. **Criar persistence module** em `application/persistence/<modulo>-persistence.module.ts` ligando `TOKENS.<X>Dao → <X>DaoAdapterPrisma`
10. **Criar use cases** em `application/usecases/<verbo>-<modulo>/`
11. **Criar controllers** em `infra/drivers/http/admin/` e/ou `infra/drivers/http/user/`
12. **Criar `<modulo>.module.ts`** declarando `imports`, `controllers`, `providers`
13. **Importar o módulo** em `src/app.module.ts` (ou no agregador, se sub-módulo)
14. **Adicionar claims** em `src/app/authentication/domain/authorization/claim.ts` (ex.: `<X>_READ`, `<X>_WRITE`)
15. **Adicionar enum subjects** em `src/app/authentication/domain/authorization/claim-subject.enum.ts`

### CLI gerador interno

O projeto tem um gerador via Handlebars: `npm run generate:module <nome-do-modulo> [--ddd]`. Cria toda a estrutura básica em `src/app/<nome>/`. Use como ponto de partida e ajuste conforme o domínio. Os templates ficam em `scripts/templates/`.

## Convenções Obrigatórias

- Pasta do módulo em **kebab-case singular**: `client-attachment/`, não `clientAttachments/`
- Arquivo do módulo: **`<modulo>.module.ts`** na raiz (mesmo nome da pasta)
- DTO do agregado em `application/dtos/<modulo>.dto.ts` — chamado `<Module>Dto` (ex.: `FaqDto`, `AdminDto`)
- Cada use case fica em **sua própria pasta** dentro de `usecases/`, nomeada `<verbo>-<modulo>/`
- DTOs de input/output do use case ficam em `usecases/<verbo>-<modulo>/dtos/<verbo>-<modulo>.dto.ts`
- Adapters Prisma sempre em `infra/driven/persistence/prisma/<modulo>-prisma.<dao|repository>.ts`
- Controllers separados por canal: `infra/drivers/http/admin/<modulo>-admin.controller.ts` e `http/user/<modulo>-user.controller.ts`
- Sub-módulos de um agregado vão em `src/app/<agregado>/<sub-modulo>/` e são listados no `<agregado>-module.module.ts` (ver `client-module.module.ts`)

## Anti-Padrões (Nunca Faça)

- ❌ **Não** crie pastas `services/`, `controllers/`, `repositories/` no nível superior do módulo (estilo Nest CLI default). O projeto usa hexagonal: `domain/application/infra`
- ❌ **Não** misture domínios em um mesmo módulo. Se aparecer dois agregados, separe em dois módulos
- ❌ **Não** coloque controller na raiz do módulo. Sempre em `infra/drivers/http/<canal>/`
- ❌ **Não** coloque DAO na raiz nem em `application/`. Sempre em `infra/driven/persistence/prisma/`
- ❌ **Não** esqueça de adicionar `<camelCase>.deleteMany()` no `PrismaService.truncate()` na ordem correta de FK — vai quebrar testes de integração
- ❌ **Não** crie `index.ts` (barrel files) dentro do módulo

## Exemplo Completo

`FaqModule` é a referência canônica de módulo simples:

```1:32:src/app/faq/faq.module.ts
import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { FaqPersistenceModule } from './application/persistence/faq-persistence.module';
import { CreateFaq } from './application/usecases/create-faq/create-faq.service';
import { DeleteFaq } from './application/usecases/delete-faq/delete-faq.service';
import { EditFaq } from './application/usecases/edit-faq/edit-faq.service';
import { FindAllFaq } from './application/usecases/find-all-faq/find-all-faq.service';
import { FindFaqById } from './application/usecases/find-faq-by-id/find-faq-by-id.service';
import { UpdateFaqStatus } from './application/usecases/update-faq-status/update-faq-status.service';
import { FaqAdminController } from './infra/drivers/http/admin/faq-admin.controller';
import { FaqUserController } from './infra/drivers/http/user/faq-user.controller';

@Module({
  imports: [
    FaqPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    FaqAdminController,
    FaqUserController,
  ],
  providers: [
    CreateFaq,
    DeleteFaq,
    EditFaq,
    FindAllFaq,
    FindFaqById,
    UpdateFaqStatus,
  ],
})
export class FaqModule {}
```

`AdminModule` é a referência canônica de módulo DDD-light:

```13:34:src/app/admin/admin.module.ts
@Module({
  imports: [
    AdminPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    AdminAdminController,
  ],
  providers: [
    ActivateAdmin,
    CreateAdmin,
    EditAdmin,
    FindAllAdmin,
    FindAdminById,
    FindPermissionSubjects,
    DeactivateAdmin,
  ],
  exports: [
    FindAdminById,
  ],
})
export class AdminModule {}
```

A diferença está apenas em `domain/` (entity + factory + erros adicionais) e `application/persistence/` (que tem `dao/` E `repository/`).
