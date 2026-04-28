---
name: dependency-injection
description: >-
  Padrão de Injeção de Dependência do projeto (Nest IoC + tokens Symbol).
  Use ao adicionar um novo token, registrar um adapter, criar
  persistence-module, decidir entre @Inject(TOKENS.X) e injeção direta de
  classe, ou quando o usuário disser "injetar dependência", "registrar
  provider", "criar token", "binding", "como o Nest injeta isso", "Symbol.for",
  "useClass vs useFactory", "inject de outro módulo".
---

# Injeção de Dependência

## Contexto

O container IoC do NestJS é usado de forma disciplinada:

- **Tokens DI** vivem **exclusivamente** em `src/core/di/token.ts` como `Symbol.for('NomeDoPort')`
- **Ports** (interfaces de DAO/Repository/Gateway) são injetados via `@Inject(TOKENS.X)` + `import type { IxxxDao }`
- **Use cases concretos** são injetados **diretamente pela classe** (sem token), porque são classes concretas
- **Adapters** são bindados em `<modulo>-persistence.module.ts` (para persistência) ou `<modulo>.module.ts` (para gateways) com `{ provide: TOKENS.X, useClass: <Adapter> }`
- **Adapters condicionais (real vs fake)** vão em `DynamicModule.register()` que checa `NODE_ENV === 'test'`

## Estrutura e Localização

```
src/core/di/token.ts                              # Lista única de TOKENS
src/app/<x>/<modulo>/application/persistence/
└── <modulo>-persistence.module.ts                # Bind de DAO/Repository
src/infra/<gateway>/
└── <gateway>.module.ts                           # Bind de Gateway (fake vs real)
```

## Como Fazer

### 1) Registrar um token

Em `src/core/di/token.ts`:

```typescript
const TOKENS = {
  // ...
  FaqDao: Symbol.for('FaqDao'),
  AdminDao: Symbol.for('AdminDao'),
  AdminRepository: Symbol.for('AdminRepository'),
  CacheGateway: Symbol.for('CacheGateway'),
  // adicione novos aqui
};

export { TOKENS };
```

Convenção do nome: **`<Entity><Categoria>`** em `PascalCase`. Categorias: `Dao`, `Repository`, `Gateway`, `QueueProducer`. O `Symbol.for(...)` recebe **a mesma string que o nome do token**.

### 2) Bindar adapter de persistência (DAO/Repository)

```1:18:src/app/faq/application/persistence/faq-persistence.module.ts
import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { FaqDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/faq-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.FaqDao,
    useClass: FaqDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class FaqPersistenceModule {}
```

### 3) Injetar port em um use case

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';

@Injectable()
export class CreateFaq {
  constructor(
    @Inject(TOKENS.FaqDao) private readonly faqDao: IFaqDao,
  ) {}

  // ...
}
```

⚠️ Use **`import type {...}`** quando importar a interface — evita ciclo em runtime e deixa claro que é só typing.

### 4) Injetar use case concreto

Use cases de outros módulos são injetados **direto pelo construtor** (são classes, não precisam de token):

```typescript
constructor(
  @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
  private readonly findClientGroupById: FindClientGroupById,    // <- direto
  private readonly findCompanyById: FindCompanyById,            // <- direto
) {}
```

Para isso o módulo origem precisa **exportar o use case**:

```typescript
@Module({
  imports: [...],
  providers: [FindClientGroupById, ...],
  exports: [FindClientGroupById],   // <- exporta para outros módulos
})
export class ClientGroupModule {}
```

E o módulo consumidor precisa **importar o módulo origem** em `imports: [...]`.

### 5) Bindar gateway com `DynamicModule.register()` (real vs fake)

Padrão para qualquer infra externa (cache, S3, CNPJa, ViaCEP, fila):

```10:30:src/infra/cache/cache.module.ts
@Global()
@Module({})
export class CacheModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: CacheModule,
      imports: [
        ConfigModule,
      ],
      providers: [
        {
          provide: TOKENS.CacheGateway,
          useClass: isTest ? CacheFakeAdapterGateway : CacheRedisAdapterGateway,
        },
      ],
      exports: [
        TOKENS.CacheGateway,
      ],
    };
  }
}
```

Importação: `CacheModule.register()` — **não esqueça os parênteses**.

### 6) Provider com `useFactory`

Quando o adapter precisa de configuração injetada, use `useFactory`:

```9:24:src/infra/logger/logger.module.ts
@Global()
@Module({
  imports: [
    ConfigModule,
  ],
  providers: [
    {
      provide: TOKENS.LoggerGateway,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.isTest
          ? new LoggerFakeAdapterGateway()
          : new LoggerWinstonAdapterGateway();
      },
    },
  ],
  exports: [
    TOKENS.LoggerGateway,
  ],
})
export class LoggerModule {}
```

### 7) Filter/Interceptor globais

Registre via tokens do Nest (`APP_FILTER`, `APP_INTERCEPTOR`):

```1:13:src/core/filters/filter.module.ts
import { Module } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception/http-exception.filter';

@Module({
  providers: [
    {
      provide: 'APP_FILTER',
      useClass: HttpExceptionFilter,
    },
  ],
})
export class FilterModule {}
```

Idem para o `AuditInterceptor` em `AuditModule` com `APP_INTERCEPTOR`.

### 8) `@Global()` para módulos transversais

`DatabaseModule`, `CacheModule`, `LoggerModule` são **`@Global()`**: registrados uma vez e disponíveis em todo lugar. Mas o **persistence module do feature** (`FaqPersistenceModule`) ainda precisa importar `DatabaseModule` explicitamente nos `imports` para dependências locais.

### 9) `forwardRef` em ciclos

Se dois módulos se importam mutuamente, use `forwardRef(() => XxxModule)`:

```22:32:src/app/client/client/client.module.ts
@Module({
  imports: [
    forwardRef(() => ClientAddressModule),
    ClientPersistenceModule,
    ClientGroupModule,
    ClientOwnerModule,
    ClientAttendanceModule,
    ClientMaintenanceTicketModule,
    CompanyModule,
    AuthenticationGuardsModule,
  ],
```

## Convenções Obrigatórias

- Tokens SEMPRE em `src/core/di/token.ts` como `Symbol.for('Nome')`
- Nome do token = nome da string passada a `Symbol.for`
- Ports (DAO/Repository/Gateway) injetados via `@Inject(TOKENS.X)` + `import type { … }`
- Use cases concretos injetados direto (sem `@Inject`)
- Adapters bindados em `<modulo>-persistence.module.ts` (persistência) ou no próprio gateway module
- Gateway com fake/real → `DynamicModule.register()` com `process.env.NODE_ENV === Environment.Test`
- `private readonly` em todas as injeções
- Use `useClass` quando o adapter não precisa de config; `useFactory` quando precisa

## Anti-Padrões (Nunca Faça)

- ❌ Declarar tokens fora de `src/core/di/token.ts`
- ❌ Usar `string` como token (`@Inject('FaqDao')`). Sempre `Symbol.for` via `TOKENS.X`
- ❌ Injetar `PrismaService` em use case
- ❌ Injetar `XxxDao` (DAO de outro módulo) num use case. **Importe o `Module` e injete o use case exportado**
- ❌ Esquecer `imports: [<XxxModule>]` quando precisa do `provider` exportado por ele
- ❌ Esquecer `exports: [<X>]` no módulo origem quando o use case é consumido por outro módulo
- ❌ Usar `process.env.X` em vez de `ConfigService` (exceto em `main.ts` e dentro de `register()` para escolher fake/real)
- ❌ `@Global()` em módulos de feature. `@Global()` é só para infra cross-cutting

## Exemplo Completo

Module de feature ligando tudo (`FaqModule`) — note como ele **importa** o persistence module e o guards module, **declara** os providers e controllers, e **exporta** apenas o que é reusado por outros módulos:

```13:31:src/app/faq/faq.module.ts
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

Trecho do `core/di/token.ts` para referência das categorias:

```12:18:src/core/di/token.ts
  AccountDao: Symbol.for('AccountDao'),
  FaqDao: Symbol.for('FaqDao'),

  ClientDao: Symbol.for('ClientDao'),
  ClientRepository: Symbol.for('ClientRepository'),
  ClientSequenceRepository: Symbol.for('ClientSequenceRepository'),
```
