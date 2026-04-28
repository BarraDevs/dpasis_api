---
name: domain-modeling
description: >-
  Como modelar a camada de domínio do projeto: Entidades (com _instantiate
  privado), Factories (create/edit/load), Value Objects e Erros. Use ao criar
  uma entidade rica, ao adicionar uma factory, ao criar um VO em
  src/shared/value-objects/, ao definir invariantes de negócio, ou quando o
  usuário disser "criar entidade", "modelar agregado", "criar factory",
  "criar value object", "regra de negócio do agregado", "validar dados de
  domínio". Importante para distinguir DDD-light vs CRUD simples.
---

# Modelagem de Domínio

## Contexto

O projeto adota **DDD-light** em módulos com regras de negócio reais. A camada `domain/` contém **apenas TypeScript puro** — zero dependências de NestJS, Prisma, class-validator ou qualquer framework. As três peças canônicas são:

- **Entity**: encapsula estado e invariantes; tem `_instantiate` static privado e `props` readonly
- **Factory**: ponto único de criação/edição/carregamento da entidade; valida campos via VOs
- **Value Object (VO)**: tipo imutável que valida no construtor (`new Email(x)`, `new CNPJ(x)`)

Há também **erros de domínio** em `domain/errors/` que estendem `AppException` (ver skill `error-handling`).

## Estrutura e Localização

```
src/app/<contexto>/<modulo>/domain/
├── entities/<modulo>.entity.ts
├── factories/<modulo>.factory.ts
├── value-objects/<vo-name>/<vo-name>.vo.ts        # VOs específicos do contexto (raros)
├── enums/<x>.enum.ts
└── errors/<razão>.error.ts

src/shared/value-objects/                          # VOs reutilizáveis
├── cnpj/cnpj.vo.ts
├── cpf/cpf.vo.ts
├── document/document.vo.ts
├── email/email.vo.ts
├── non-empty-string/non-empty-string.vo.ts
├── optional-string/optional-string.vo.ts
├── password/password.vo.ts
├── pagination/pagination.vo.ts
├── phone/phone.vo.ts
├── positive-int/positive-int.vo.ts
├── boolean/boolean.vo.ts
├── enum/enum.vo.ts
├── code/code.vo.ts
├── commission/commision.vo.ts
├── due-date-day/due-date-day.vo.ts
├── emission-day/emission-day.vo.ts
├── billing-months/billing-months.vo.ts
├── utc-date/utc-date.vo.ts
└── uuid/uuid.vo.ts
```

## Como Fazer

### 1) Entidade rica (com `_instantiate` privado)

```19:48:src/app/admin/domain/entities/admin.entity.ts
export class Admin {
  private readonly _props: AdminProps;

  static _instantiate(props: AdminProps): Admin {
    return new Admin(props);
  }

  private constructor(props: AdminProps) {
    this._props = props;
  }

  public get props(): Readonly<AdminProps> {
    return { ...this._props };
  }

  public isActive(): boolean {
    return this._props.status === AccountStatus.ACTIVE;
  }

  public activate(): void {
    this._props.status = AccountStatus.ACTIVE;
  }

  public deactivate(): void {
    if (!this._props.canBeRemoved) {
      throw new AdminCannotBeInactiveError();
    }
    this._props.status = AccountStatus.INACTIVE;
  }
}
```

Pontos canônicos:
- **Construtor `private`** — só o `_instantiate` da própria classe ou a Factory criam a entidade
- **`_instantiate` static** — usado pela Factory e nada mais (o `_` indica "uso interno")
- **`props` é readonly** — `get props(): Readonly<XxxProps> { return { ...this._props } }` (cópia para evitar mutação externa)
- **Métodos de negócio** alteram `_props` internamente (`activate`, `deactivate`)
- **Invariantes lançam erros do domínio** (`AdminCannotBeInactiveError`)

### 2) Tipos `Props` da entidade (separação Create vs Full)

```5:17:src/app/admin/domain/entities/admin.entity.ts
export type AdminProps = AdminCreateProps & {
  accountId: number;
  status: AccountStatus;
  canBeRemoved: boolean;
};

export type AdminCreateProps = {
  document: string;
  name: string;
  email: string;
  profilePicture: string | null;
  claims: ClaimValue[];
};
```

- **`<Entity>CreateProps`** — campos obrigatórios na criação
- **`<Entity>Props`** — `<Entity>CreateProps` + campos derivados/persistidos (id, status default, flags imutáveis)

### 3) Factory (`create` / `edit` / `load`)

```26:97:src/app/admin/domain/factories/admin.factory.ts
export class AdminFactory {
  private static parseClaimValues(rows: ClaimInput[]): ClaimValue[] {
    const parsed: ClaimValue[] = [];
    for (const row of rows) {
      const c = claimFromSubjectAction(row.subject.trim(), row.action.trim());
      if (c === null) {
        throw new InvalidAdminClaimsError();
      }
      parsed.push(c);
    }
    return parsed;
  }

  private static validateCreateProps(props: AdminCreateProps): AdminCreateProps {
    return {
      document: new Document(props.document).value,
      name: new NonEmptyString(props.name, 'name').value,
      email: new Email(props.email).value,
      profilePicture: new OptionalString(props.profilePicture, 'profilePicture').value,
      claims: props.claims,
    };
  }

  static create(props: AdminFactoryCreateInput): Admin {
    const claims = this.parseClaimValues(props.claims);
    const validatedProps = this.validateCreateProps({ ... });

    return Admin._instantiate({
      ...validatedProps,
      accountId: 0,
      status: AccountStatus.ACTIVE,
      canBeRemoved: true,
    });
  }

  static edit(props: AdminFactoryEditInput): Admin { ... }

  static load(props: AdminProps): Admin {
    return Admin._instantiate({ ... });
  }
}
```

Os três métodos canônicos da Factory:

| Método | Quando usar | Aplica VOs? |
|---|---|---|
| `create(input)` | Criar entidade nova (vinda de input HTTP) | ✅ valida tudo via VOs |
| `edit(props)` | Editar entidade existente (após `findById`) | ✅ valida campos editáveis |
| `load(props)` | Reidratar entidade após `findById` do banco | ❌ confia no banco (NÃO valida) |

### 4) Value Object reutilizável

Padrão: `_value` privado readonly, validação no construtor, getter `value`, erro tipado.

```1:22:src/shared/value-objects/email/email.vo.ts
import { InvalidEmailError } from './email.error';

export class Email {
  private readonly _value: string;

  public get value(): string {
    return this._value;
  }

  constructor(email: string) {
    const normalized = email?.trim().toLowerCase() ?? '';
    if (!this.validate(normalized)) {
      throw new InvalidEmailError(email);
    }
    this._value = normalized;
  }

  private validate(email: string): boolean {
    const regex = new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
    return regex.test(email);
  }
}
```

Variantes detectadas:

```1:17:src/shared/value-objects/non-empty-string/non-empty-string.vo.ts
export class NonEmptyString {
  private readonly _value: string;

  constructor(value: string, fieldName: string) {
    if (!value || typeof value !== 'string' || !value.trim().length) {
      throw new AppException(`O campo ${fieldName} não pode ser vazio`);
    }
    this._value = value;
  }

  public get value(): string {
    return this._value;
  }
}
```

Note que `NonEmptyString` recebe um **`fieldName`** segundo argumento — o erro fica contextualizado para o usuário final.

### 5) VO específico do contexto

Quando o VO modela um conceito do bounded context (não reusável), fica em `domain/value-objects/<vo>/<vo>.vo.ts` do próprio módulo. Exemplos: `AdminSubjectPermissionsVo` (em `admin/`), `AdminSubjectCatalogVo` (em `admin/`).

### 6) VOs reutilizáveis disponíveis

| VO | Validação |
|---|---|
| `CNPJ` | Sanitiza + valida dígitos verificadores |
| `CPF` | Idem |
| `Document` | CPF ou CNPJ (escolhe pela quantidade de dígitos) |
| `Email` | Trim + lowercase + regex |
| `Phone` | Sanitização e validação |
| `Password` | Hash bcrypt — `new Password(plain).value` retorna o hash |
| `NonEmptyString(value, fieldName)` | String não vazia obrigatória |
| `OptionalString(value, fieldName)` | Aceita null/undefined ou trimmed string |
| `PositiveInt(value, fieldName)` | Número inteiro positivo |
| `BooleanVo(value, fieldName)` | Boolean estrito |
| `Enum(value, EnumType, fieldName)` | Validação contra enum TS |
| `UUID` | `new UUID().value` gera novo UUID |
| `Pagination<T>` | Paginação (ver skill `use-case-creation`) |
| `Code` | Códigos com formato específico |
| `Commission` | Percentuais |
| `EmissionDay` / `DueDateDay` / `BillingMonths` / `UtcDate` | Tipos de data específicos |

### 7) Enum

```1:4:src/app/account/domain/enums/account-role.enum.ts
export enum AccountRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
}
```

`PascalCase` para o nome, `UPPER_SNAKE_CASE` para os valores. Sem `const enum`. Arquivo `<nome>.enum.ts`.

## Convenções Obrigatórias

- `domain/` é **puro TypeScript**: ZERO imports de `@nestjs/...`, `@prisma/...`, `class-validator`, `class-transformer`
- Entidade tem **construtor `private`** + **`_instantiate` static** + **`props` readonly**
- Factory é a **única forma** de criar/reidratar a entidade
- `factory.create(input)` valida via VOs; `factory.load(rowFromDb)` não valida (confia no banco)
- VOs encapsulam validação no construtor; nunca exponham método `set`
- VOs reutilizáveis em `src/shared/value-objects/<vo>/<vo>.vo.ts` (kebab-case)
- VOs específicos do contexto em `src/app/<x>/domain/value-objects/<vo>/<vo>.vo.ts`
- Cada VO tem seu **erro irmão**: `email.vo.ts` + `email.error.ts` + `email.vo.spec.ts`
- Erros de domínio sempre `extends AppException` em `domain/errors/<razão>.error.ts`
- Métodos da entidade usam `public` explícito; helpers privados são `private`

## Anti-Padrões (Nunca Faça)

- ❌ Importar `@prisma/client` em `domain/`. NUNCA
- ❌ Importar `class-validator` em `domain/`. Validação no domínio é VOs e Factory, não decorators
- ❌ Construtor público da entidade. Sempre `private` + `_instantiate`
- ❌ Mutar `entity.props.X = ...` direto. Use métodos (`activate()`, `deactivate()`, etc.)
- ❌ Retornar `_props` direto do getter. Sempre `{ ...this._props }` (cópia)
- ❌ Setters em VOs. VOs são imutáveis
- ❌ Factory que faz I/O (banco, HTTP, cache). Factory é puramente computacional
- ❌ Ignorar a Factory e instanciar a entidade no DAO. Use sempre `XxxFactory.load(row)`
- ❌ Adicionar regra de domínio ao DTO de input HTTP. DTO valida formato, domínio valida invariantes

## Exemplo Completo

VO de input + Factory + Entity em ação dentro de um use case:

```22:43:src/app/admin/application/usecases/create-admin/create-admin.service.ts
  public async execute(data: CreateAdminInputDto): Promise<CreateAdminOutputDto> {
    const claims = AdminSubjectPermissionsVo.fromInput(data.subjects).toClaims();

    const entity = AdminFactory.create({
      name: data.name,
      email: data.email,
      document: data.document,
      profilePicture: data.profilePicture ?? null,
      claims,
    });

    const emailTaken = await this.adminDao.findByEmail(entity.props.email);
    // ...

    const passwordHash = new Password(data.password).value;
    const id = await this.adminRepository.save(entity, passwordHash);
    // ...
  }
```

A `entity.props.email` já está normalizada (lowercase + trim) porque foi passada pelo VO `Email` na Factory. O `passwordHash` veio do VO `Password`. As `claims` foram validadas e tipadas pelo VO específico `AdminSubjectPermissionsVo`. Tudo é determinístico e sem efeitos colaterais.
