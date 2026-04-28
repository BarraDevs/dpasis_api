---
name: repository-pattern
description: >-
  Padrão Repository usado em módulos DDD-light para PERSISTIR e RECONSTITUIR
  entidades de domínio. Use quando o módulo tem entidade rica + factory (ex.:
  admin, client, resale, company, service-catalog), quando precisar criar
  IxxxRepository / xxx-prisma.repository.ts, quando o usuário disser
  "criar repository", "repositório de entidade", "persistir agregado",
  "salvar entity X", "transação multi-tabela", ou quando estiver na dúvida
  entre DAO e Repository.
---

# Padrão Repository

## Contexto

O **Repository é o port de escrita/leitura de entidades reidratadas**. Ele recebe **a entidade do domínio** (`Admin`, `Client`, etc.), faz a persistência (com transações multi-tabela quando necessário) e, ao ler, **reconstrói a entidade via Factory**.

O Repository coexiste com o DAO no mesmo módulo:

| | DAO | Repository |
|---|---|---|
| Retorno de leitura | `XxxDto`, `XxxDto[]`, `null` | `Xxx` (entidade) ou `null` |
| Tipo dos métodos | `findAll`, `findById`, `findByEmail`, … | `save`, `edit`, `findById`, `delete`, casos especiais |
| Argumento de escrita | DTOs primitivos | Entidade do domínio |
| Onde fica a interface | `application/persistence/dao/` | `application/persistence/repository/` |
| Onde fica o adapter | `infra/driven/persistence/prisma/<x>-prisma.dao.ts` | `infra/driven/persistence/prisma/<x>-prisma.repository.ts` |

Use Repository quando o módulo tem:
- **Entidade rica** em `domain/entities/`
- **Factory** (`create`/`edit`/`load`)
- **Transação multi-tabela** (ex.: `Admin` cria registro em `account` + `admin` + `account_claim` no mesmo `$transaction`)

Em CRUDs simples (`faq`, `client-group`, `client-owner`) o DAO sozinho cobre tudo. **Não force Repository onde não há entidade.**

## Estrutura e Localização

```
src/app/<contexto>/<modulo>/
├── domain/
│   ├── entities/<modulo>.entity.ts                    # Entidade rica
│   └── factories/<modulo>.factory.ts                  # create/edit/load
├── application/
│   ├── dtos/<modulo>.dto.ts                           # Para DAO (leitura)
│   └── persistence/
│       ├── <modulo>-persistence.module.ts             # Binding dos 2 tokens
│       ├── dao/<modulo>-dao.interface.ts              # IxxxDao (leitura)
│       └── repository/<modulo>-repository.interface.ts # IxxxRepository (escrita)
└── infra/driven/persistence/prisma/
    ├── <modulo>-prisma.dao.ts
    └── <modulo>-prisma.repository.ts
```

## Como Fazer

### 1) Definir o port

```1:8:src/app/admin/application/persistence/repository/admin-repository.interface.ts
import { Admin } from 'src/app/admin/domain/entities/admin.entity';

export interface IAdminRepository {
  save(entity: Admin, passwordHash: string): Promise<number>;
  edit(entity: Admin): Promise<void>;
  findById(id: number): Promise<Admin | null>;
}
```

Assinaturas canônicas:

| Método | Argumento | Retorno |
|---|---|---|
| `save(entity, ...extras?)` | A entidade do domínio (+ extras como `passwordHash`) | `Promise<number>` (id criado) |
| `edit(entity)` | Entidade reconstituída e modificada | `Promise<void>` |
| `findById(id)` | id primitivo | `Promise<Xxx \| null>` (entidade) |
| `delete(id)` | id primitivo | `Promise<void>` |

### 2) Implementar o adapter Prisma — escrita com `$transaction`

```17:46:src/app/admin/infra/driven/persistence/prisma/admin-prisma.repository.ts
  public async save(entity: Admin, passwordHash: string): Promise<number> {
    return this.prisma.$transaction(async(tx) => {
      const account = await tx.account.create({
        data: {
          role: AccountRole.ADMIN,
          name: entity.props.name,
          email: entity.props.email,
          password: passwordHash,
          status: entity.props.status,
          profilePicture: entity.props.profilePicture,
          canBeRemoved: entity.props.canBeRemoved,
        },
      });

      await tx.admin.create({
        data: {
          accountId: account.id,
          document: entity.props.document,
        },
      });

      const rows = this.dedupeClaimsForCreate(entity.props.claims, account.id);
      if (rows.length > 0) {
        await tx.accountClaim.createMany({ data: rows });
      }

      return account.id;
    });
  }
```

### 3) Implementar `findById` reidratando via Factory

```81:111:src/app/admin/infra/driven/persistence/prisma/admin-prisma.repository.ts
  public async findById(id: number): Promise<Admin | null> {
    const row = await this.prisma.admin.findUnique({
      where: { accountId: id },
      include: {
        account: {
          include: {
            claims: { select: { subject: true, action: true } },
          },
        },
      },
    });

    if (!row) {
      return null;
    }

    const claims: ClaimValue[] = row.account.claims
      .map(c => claimFromSubjectAction(c.subject, c.action))
      .filter((c): c is ClaimValue => c !== null);

    return AdminFactory.load({
      accountId: row.accountId,
      document: row.document,
      name: row.account.name,
      email: row.account.email,
      profilePicture: row.account.profilePicture,
      status: row.account.status as AccountStatus,
      canBeRemoved: row.account.canBeRemoved,
      claims,
    });
  }
```

### 4) Bindar ambos no persistence module

```1:24:src/app/admin/application/persistence/admin-persistence.module.ts
import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { AdminDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/admin-prisma.dao';
import { AdminRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/admin-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.AdminDao,
    useClass: AdminDaoAdapterPrisma,
  },
  {
    provide: TOKENS.AdminRepository,
    useClass: AdminRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class AdminPersistenceModule {}
```

### 5) Repository especializado (sequência/contador)

Quando há **invariantes de unicidade que exigem operações atômicas**, crie um repository dedicado. Ex.: `IClientSequenceRepository` (`getAndIncrement`, `ensureNextIdIsAtLeast`):

```1:9:src/app/client/client/application/persistence/repository/client-repository.interface.ts
import { Client } from 'src/app/client/client/domain/entities/client.entity';

export interface IClientRepository {
  save(entity: Client): Promise<number>;
  edit(entity: Client): Promise<void>;
  findById(id: number): Promise<Client | null>;
  delete(id: number): Promise<void>;
  linkAttendanceAndMaintenance(clientId: number, attendanceId: number, maintenanceTicketId: number): Promise<void>;
}
```

Adicione tokens em `core/di/token.ts`:
```ts
ClientRepository: Symbol.for('ClientRepository'),
ClientSequenceRepository: Symbol.for('ClientSequenceRepository'),
```

### 6) Edit completo: re-criar relações

Para `edit`, o padrão típico é **deletar todas as relações antigas e recriar**, dentro da mesma `$transaction`. Não tente fazer diff manual:

```48:79:src/app/admin/infra/driven/persistence/prisma/admin-prisma.repository.ts
  public async edit(entity: Admin): Promise<void> {
    const id = entity.props.accountId;
    const { claims } = entity.props;

    await this.prisma.$transaction(async(tx) => {
      await tx.account.update({ ... });
      await tx.admin.update({ ... });

      // Sempre remove todas as claims antes de persistir a nova lista.
      // Não colocar o delete dentro do `if (rows.length > 0)`: se o payload vier
      // com lista vazia, precisamos apagar as antigas para refletir o estado.
      await tx.accountClaim.deleteMany({ where: { accountId: id } });

      const rows = this.dedupeClaimsForCreate(claims, id);
      if (rows.length > 0) {
        await tx.accountClaim.createMany({ data: rows });
      }
    });
  }
```

## Convenções Obrigatórias

- Interface nomeada **`I<Entity>Repository`** em `application/persistence/repository/<modulo>-repository.interface.ts`
- Implementação nomeada **`<Entity>RepositoryAdapterPrisma`** em `infra/driven/persistence/prisma/<modulo>-prisma.repository.ts`
- Token nomeado **`<Entity>Repository`** (sem `Adapter`) em `core/di/token.ts`
- `save(entity)` retorna o **id** criado; `edit(entity)` retorna `void`
- Operações multi-tabela SEMPRE em `this.prisma.$transaction(async(tx) => { … })`
- `findById` reidrata via **`<Entity>Factory.load(...)`** — nunca instancie a entidade direto
- Use `tx.<table>` nas operações dentro da transação (não use `this.prisma.<table>`)
- Comentários em português explicando decisões não óbvias (ex.: por que deletar antes de inserir)

## Anti-Padrões (Nunca Faça)

- ❌ Repositório que retorna DTO. **Repository retorna entidade.** Se precisa de DTO, use o DAO
- ❌ Misturar `find*` de leitura no Repository quando já existe o DAO. O Repository tem só `findById` (para reidratar)
- ❌ Reconstruir entidade com `new Admin(...)` direto. Sempre via Factory
- ❌ Persistir entidade sem `$transaction` em casos multi-tabela (Account + Admin + Claims é UMA operação atômica)
- ❌ Repositório fora do Prisma adapter. Não há ORM alternativo no projeto
- ❌ Usar Repository em CRUD simples (FAQ, ClientGroup, ClientOwner). DAO basta
- ❌ Misturar regras de negócio no Repository — ele só persiste/lê. Regras vão no use case ou na entidade

## Exemplo Completo

Caso completo: `CreateAdmin` use case usa **DAO para verificações** (e-mail/documento já existem) e **Repository para persistir** a entidade:

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

Resumo da divisão:
- **DAO**: `findByEmail`, `findByDocument`, `findAll`, `findById` (retorna DTO)
- **Repository**: `save(entity, passwordHash)`, `edit(entity)`, `findById` (retorna entidade)
