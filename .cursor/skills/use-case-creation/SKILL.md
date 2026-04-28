---
name: use-case-creation
description: >-
  Padrão para criar/modificar um Use Case (Application Service) no projeto.
  Use SEMPRE que precisar criar uma nova ação de negócio (Create, Edit, Delete,
  FindAll, FindById, UpdateStatus, Activate/Deactivate, etc.), implementar uma
  regra de negócio, orquestrar chamadas a DAO/Repository, ou quando o usuário
  disser "criar use case", "criar service", "novo caso de uso", "implementar
  ação X", "implementar Create/Edit/Delete de X", "lógica de negócio".
---

# Criação de Use Case (Application Service)

## Contexto

Use cases (a.k.a. Application Services) implementam **um único caso de uso de negócio**, são **`@Injectable()`**, têm método público **`execute(...)`** e dependem apenas de ports (DAO/Repository) e de outros use cases — nunca de tecnologia concreta. São o ponto de orquestração entre `domain/` e `infra/`.

## Estrutura e Localização

Cada use case fica em uma pasta dedicada dentro de `application/usecases/`:

```
application/usecases/
└── <verbo>-<modulo>/
    ├── <verbo>-<modulo>.service.ts                # Classe @Injectable
    ├── <verbo>-<modulo>.service.spec.ts           # Unit (mocks)
    ├── <verbo>-<modulo>.service.integration.spec.ts
    └── dtos/
        ├── <verbo>-<modulo>.dto.ts                # Input/Output DTOs
        └── <verbo>-<modulo>.dto.spec.ts           # Validação via ValidationPipe
```

Verbos canônicos detectados no código:

| Verbo | Significado | Exemplo |
|---|---|---|
| `Create` | Criar nova entidade | `CreateFaq`, `CreateAdmin`, `CreateClient` |
| `Edit` | Atualizar entidade existente (PATCH) | `EditFaq`, `EditAdmin`, `EditClient` |
| `Delete` | Remover entidade | `DeleteFaq` |
| `FindAll` | Listar com paginação/filtros | `FindAllFaq`, `FindAllAdmin` |
| `Find<X>ById` | Buscar 1 por id (404 se não achar) | `FindFaqById`, `FindAdminById` |
| `UpdateXStatus` | Inverter `active` (toggle) | `UpdateFaqStatus` |
| `Activate` / `Deactivate` | Ativar/inativar explicitamente | `ActivateAdmin`, `DeactivateAdmin`, `ActivateClient` |
| `FindXBy<Critério>` | Busca específica | `FindAccountByCredential` |
| `FindSub<X>` | Listagem em sub-recurso | `FindSubClients` |
| `Get<X>Sequence` | Operações de domínio específicas | `GetClientSequence`, `LinkClientAttendanceAndMaintenance` |

## Como Fazer

### 1) Estrutura mínima de um use case

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { CreateFaqInputDto, CreateFaqOutputDto } from './dtos/create-faq.dto';

@Injectable()
export class CreateFaq {
  constructor(
    @Inject(TOKENS.FaqDao) private readonly faqDao: IFaqDao,
  ) {}

  public async execute(data: CreateFaqInputDto): Promise<CreateFaqOutputDto> {
    const id = await this.faqDao.save(data);
    return { id };
  }
}
```

### 2) Use case com validação de existência (FindById)

Sempre lance um erro tipado do domínio quando não encontrar:

```7:21:src/app/faq/application/usecases/find-faq-by-id/find-faq-by-id.service.ts
@Injectable()
export class FindFaqById {
  constructor(
    @Inject(TOKENS.FaqDao) private readonly faqDao: IFaqDao,
  ) {}

  public async execute(id: number): Promise<FaqDto> {
    const faq = await this.faqDao.findById(id);
    if (!faq) {
      throw new FaqNotFoundError();
    }

    return faq;
  }
}
```

### 3) Use case que retorna mensagem de sucesso (Edit/Delete/UpdateStatus)

Para operações sem retorno significativo, retorne `SuccessMessage` (`src/core/dtos/success-message.dto.ts`):

```9:24:src/app/faq/application/usecases/edit-faq/edit-faq.service.ts
@Injectable()
export class EditFaq {
  constructor(
    @Inject(TOKENS.FaqDao) private readonly faqDao: IFaqDao,
  ) {}

  public async execute(id: number, data: EditFaqInputDto): Promise<SuccessMessage> {
    const faq = await this.faqDao.findById(id);
    if (!faq) {
      throw new FaqNotFoundError();
    }

    await this.faqDao.edit(id, data);

    return { message: 'FAQ atualizado com sucesso' };
  }
}
```

### 4) Use case com paginação (FindAll)

Sempre use o VO `Pagination`:

```8:19:src/app/faq/application/usecases/find-all-faq/find-all-faq.service.ts
@Injectable()
export class FindAllFaq {
  constructor(
    @Inject(TOKENS.FaqDao) private readonly faqDao: IFaqDao,
  ) {}

  public async execute(queries: FindAllFaqQueryDto): Promise<IPagination<FaqDto>> {
    const [result, total] = await this.faqDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
```

### 5) Use case DDD com Factory + Repository (Create complexo)

Quando há entidade rica + invariantes + múltiplas validações, use a `Factory` para construir e o `Repository` para persistir:

```12:45:src/app/admin/application/usecases/create-admin/create-admin.service.ts
@Injectable()
export class CreateAdmin {
  constructor(
    @Inject(TOKENS.AdminDao) private readonly adminDao: IAdminDao,
    @Inject(TOKENS.AdminRepository) private readonly adminRepository: IAdminRepository,
  ) {}

  public async execute(data: CreateAdminInputDto): Promise<CreateAdminOutputDto> {
    const claims = AdminSubjectPermissionsVo.fromInput(data.subjects).toClaims();

    const entity = AdminFactory.create({ ... });

    const emailTaken = await this.adminDao.findByEmail(entity.props.email);
    if (emailTaken) {
      throw new EmailAlreadyTakenError(data.email);
    }

    const documentTaken = await this.adminDao.findByDocument(entity.props.document);
    if (documentTaken) {
      throw new DocumentAlreadyTakenError(data.document);
    }

    const passwordHash = new Password(data.password).value;
    const id = await this.adminRepository.save(entity, passwordHash);

    return { id };
  }
}
```

### 6) Use case com saga compensatória manual

Quando uma operação cruza múltiplos módulos, use try/catch com rollback explícito (não há orquestrador automático):

```99:122:src/app/client/client/application/usecases/create-client/create-client.service.ts
    // saga step 1: create client
    const id = await this.clientRepository.save(entity);

    // saga step 2: create client address
    try {
      await this.createClientAddress.execute({ ... });
    }
    catch (error) {
      // rollback step 1: delete client
      await this.clientRepository.delete(id);
      throw error;
    }
```

### 7) Use case que reusa outro use case

Para validar dependências entre módulos, **injete o use case** (não o DAO do outro módulo). Os use cases reusáveis devem ser **`exports`** do módulo origem:

```typescript
constructor(
  @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
  @Inject(TOKENS.ClientRepository) private readonly clientRepository: IClientRepository,
  private readonly createClientAddress: CreateClientAddress,
  private readonly findClientGroupById: FindClientGroupById,
  private readonly findCompanyById: FindCompanyById,
) {}

// Valida que o grupo existe e está ativo antes de prosseguir
await this.findClientGroupById.execute(data.groupId, { onlyActive: true });
```

`FindClientGroupById` precisa estar nos `exports` do `ClientGroupModule`.

## Convenções Obrigatórias

- Classe nomeada **`<Verbo><Entity>`** em `PascalCase`. Sem sufixo `Service`/`UseCase`. Ex.: `CreateFaq`, não `CreateFaqService` nem `CreateFaqUseCase`
- Arquivo: **`<verbo>-<modulo>.service.ts`** em kebab-case
- Sempre **`@Injectable()`** + **método único `public async execute(...)`**
- Ports injetados com **`@Inject(TOKENS.X)`** + **`type-only import`** da interface (`import type { IFaqDao } from '...'`)
- Use cases concretos injetados **diretamente pelo construtor** (sem token), como `private readonly findFaqById: FindFaqById`
- DTO de entrada nomeado **`<Verbo><Entity>InputDto`**, saída **`<Verbo><Entity>OutputDto`** (ou `SuccessMessage` para operações de mutação simples)
- Erros de domínio sempre **`extends AppException`** e moram em `domain/errors/`
- Para listagem use sempre `new Pagination(rows, total, queries.page, queries.size).getDto()`
- Validação de existência: `findById` retorna `null` → use case lança `<X>NotFoundError`
- Para regras "ativo apenas" use `findById(id, { onlyActive: true })` (FindByIdOptions); a opção é tratada no use case ou no DAO conforme o módulo

## Anti-Padrões (Nunca Faça)

- ❌ Use case com mais de uma responsabilidade. Se precisar de duas ações, faça dois use cases
- ❌ Use case que injeta `PrismaService` ou `@prisma/client`
- ❌ Use case que injeta `XxxDao` de outro módulo. Reuse o **use case exportado**
- ❌ Use case que retorna entidade do domínio (ex.: `Admin`). Sempre retorne **DTO**
- ❌ Use case que usa `console.log` ou `Logger` direto. Use `ILoggerGateway` se precisar
- ❌ Lançar `BadRequestException` / `NotFoundException` do `@nestjs/common`. Sempre `extends AppException`
- ❌ `execute(req: Request)`. Use cases não conhecem HTTP. Receba o DTO já validado
- ❌ Misturar lógica de paginação em outros use cases. Sempre delegue ao VO `Pagination`

## Exemplo Completo

Use case completo de toggle de status (CRUD simples sem entidade rica):

```7:23:src/app/faq/application/usecases/update-faq-status/update-faq-status.service.ts
@Injectable()
export class UpdateFaqStatus {
  constructor(
    @Inject(TOKENS.FaqDao) private readonly faqDao: IFaqDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const faq = await this.faqDao.findById(id);
    if (!faq) {
      throw new FaqNotFoundError();
    }

    await this.faqDao.updateStatus(id, !faq.active);

    return { message: 'Status da FAQ atualizado com sucesso' };
  }
}
```
