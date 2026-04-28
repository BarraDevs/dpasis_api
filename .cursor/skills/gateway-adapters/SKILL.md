---
name: gateway-adapters
description: >-
  Padrão Gateway/Adapter usado para integrações externas (Redis, S3,
  CNPJa, ViaCEP, BullMQ, Winston). Cada gateway tem interface, adapter
  real e adapter fake, escolhidos via DynamicModule.register() pelo
  NODE_ENV. Use ao adicionar uma integração externa nova, ao criar um
  fake para testes, ao decidir entre useClass/useFactory, ou quando o
  usuário disser "adicionar gateway", "integrar API X", "criar fake",
  "Redis", "S3", "BullMQ", "fila de jobs", "CNPJa", "ViaCEP", "logger",
  "infra externa", "register()".
---

# Gateways e Adapters de Infra

## Contexto

Toda integração externa do projeto segue o **mesmo padrão Gateway**:

1. **Interface** `IxxxGateway` em `src/infra/<x>/<x>.gateway.ts` — só os métodos que o app precisa
2. **Adapter real** em `src/infra/<x>/adapters/<tecnologia>/<x>-<tecnologia>.gateway.ts`
3. **Adapter fake** em `src/infra/<x>/adapters/fake/<x>-fake.gateway.ts` — usado em testes
4. **Module** `XxxModule` com `static register(): DynamicModule` que escolhe real vs fake baseado em `NODE_ENV === 'test'`

A decisão fake/real é feita **no momento do registro do módulo**, com `process.env.NODE_ENV` (uma das únicas exceções permitidas para ler `process.env` direto, fora de `main.ts`).

## Estrutura e Localização

```
src/infra/<gateway>/
├── <gateway>.gateway.ts                       # Interface IxxxGateway
├── <gateway>.module.ts                        # XxxModule.register()
├── adapters/
│   ├── fake/
│   │   └── <gateway>-fake.gateway.ts          # Implementação para testes
│   └── <tecnologia>/
│       ├── <gateway>-<tecnologia>.gateway.ts  # Implementação real
│       ├── <gateway>-<tecnologia>.gateway.spec.ts
│       └── dtos/                              # DTOs específicos da tecnologia (ex.: ViacepDto)
├── dtos/
│   └── <gateway>.dto.ts                       # DTO normalizado (independente da tecnologia)
└── helpers/                                   # Helpers locais (ex.: cache-key.builder.ts)
```

Gateways existentes:

| Pasta | Real | Fake | Token |
|---|---|---|---|
| `cache/` | `CacheRedisAdapterGateway` | `CacheFakeAdapterGateway` | `TOKENS.CacheGateway` |
| `cep-lookup/` | `CepLookupViacepAdapterGateway` | `CepLookupFakeAdapterGateway` | `TOKENS.CepLookupGateway` |
| `cnpj-lookup/` | `CnpjLookupCnpjaAdapterGateway` | `CnpjLookupFakeAdapterGateway` | `TOKENS.CnpjLookupGateway` |
| `logger/` | `LoggerWinstonAdapterGateway` | `LoggerFakeAdapterGateway` | `TOKENS.LoggerGateway` |
| `upload-file/` | `UploadS3AdapterGateway` | `UploadFakeAdapterGateway` | `TOKENS.UploadFileGateway` |
| `queue/` (infra global) + `<Feature>QueueModule` por feature | `<Feature>QueueBullmqAdapterProducer` + `<Feature>BullmqConsumer` | `<Feature>QueueFakeAdapterProducer` | `TOKENS.<Feature>QueueProducer` |

> **Filas/BullMQ** seguem o mesmo princípio fake/real, mas têm diferenças importantes (port + producer + consumer em pastas separadas, `BullModule.registerQueue`, enums centrais `QueueName`/`JobName`). Para qualquer trabalho com filas, use a skill dedicada **`.cursor/skills/queue-bullmq/SKILL.md`** (e a Rule 10 em `.cursor/rules/RULES.md`).

## Como Fazer

### 1) Definir a interface (port)

Mantenha o **menor conjunto de métodos** que o app realmente usa:

```1:7:src/infra/cache/cache.gateway.ts
export interface ICacheGateway {
  set<T>(key: string, value: T, ttlInSeconds?: number, skipLog?: boolean): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  deleteContaining(key: string): Promise<void>;
}
```

```1:5:src/infra/cnpj-lookup/cnpj-lookup.gateway.ts
import { CnpjLookupOutputDto } from './dtos/cnpj-lookup.dto';

export interface ICnpjLookupGateway {
  lookup(cnpj: string): Promise<CnpjLookupOutputDto>;
}
```

### 2) DTO de saída normalizado

Em `dtos/<gateway>.dto.ts`, defina o **DTO independente da tecnologia**. O adapter real mapeia o response específico (ex.: `ViacepDto`) para esse DTO normalizado:

```
src/infra/cep-lookup/
├── cep-lookup.gateway.ts                      # interface ICepLookupGateway
├── dtos/cep-lookup.dto.ts                     # CepLookupOutputDto (normalizado)
└── adapters/viacep/
    ├── cep-lookup-viacep.gateway.ts           # mapeia ViacepDto → CepLookupOutputDto
    └── dtos/viacep.dto.ts                     # forma específica da API ViaCEP
```

### 3) Module com `register()` (real vs fake)

```1:30:src/infra/cache/cache.module.ts
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from '../../core/di/token';
import { CacheFakeAdapterGateway } from './adapters/fake/cache-fake.gateway';
import { CacheRedisAdapterGateway } from './adapters/redis/cache-redis.gateway';

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

Padrão:
- `@Global()` quando o gateway é cross-cutting (cache, logger)
- `@Module({})` vazio (a config real vai no `static register()`)
- `static register(): DynamicModule` retorna `imports`, `providers`, `exports`
- `useClass: isTest ? FakeAdapter : RealAdapter`
- Importação no consumidor: `CacheModule.register()` (com parênteses)

### 4) `useFactory` quando precisa de config injetada

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

Esse caso usa `inject: [ConfigService]` e roda no `useFactory`.

### 5) Implementar o adapter real

`@Injectable()` + injeta `ConfigService` (e outros gateways, ex.: logger). Implementa a interface:

```typescript
@Injectable()
export class CnpjLookupCnpjaAdapterGateway implements ICnpjLookupGateway {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
  ) {}

  public async lookup(cnpj: string): Promise<CnpjLookupOutputDto> {
    try {
      const url = `${this.configService.cnpjaApiUrl}/${cnpj}`;
      const { data } = await firstValueFrom(this.httpService.get<CnpjaDto>(url));
      return mapCnpjaToOutput(data);
    }
    catch (error) {
      this.logger.error(LogContext.CNPJ_LOOKUP, { cnpj, error, adapter: 'cnpja' });
      throw new ExternalApiError('Falha ao consultar CNPJ na API externa.');
    }
  }
}
```

### 6) Implementar o adapter fake

Retornos determinísticos para testes:

```typescript
@Injectable()
export class CnpjLookupFakeAdapterGateway implements ICnpjLookupGateway {
  public async lookup(cnpj: string): Promise<CnpjLookupOutputDto> {
    return {
      cnpj,
      companyName: 'Empresa Fake LTDA',
      fantasyName: 'Empresa Fake',
      // ... valores fixos
    };
  }
}
```

Nunca faça I/O num fake.

### 7) Consumir o gateway num use case

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { ICnpjLookupGateway } from 'src/infra/cnpj-lookup/cnpj-lookup.gateway';

@Injectable()
export class FetchCnpjData {
  constructor(
    @Inject(TOKENS.CnpjLookupGateway) private readonly cnpjGateway: ICnpjLookupGateway,
  ) {}

  public async execute(cnpj: string) {
    return this.cnpjGateway.lookup(cnpj);
  }
}
```

E importe `CnpjLookupModule.register()` no módulo de feature.

### 8) Helper `CacheKeyBuilder`

Para chaves de cache estruturadas, use o builder em `src/infra/cache/helpers/cache-key/cache-key.builder.ts`:

```typescript
const key = new CacheKeyBuilder()
  .setResource('account')
  .setCommand('detail', accountId.toString())
  .build();
// → 'account:detail:42'
```

### 9) Logger estruturado

Sempre use `ILoggerGateway` (não `console.*`, não `Logger` do Nest):

```typescript
this.logger.error(LogContext.HTTP, {
  accountId: user.sub,
  method: 'POST',
  url: '/admin/faq',
  body: sanitizedBody,
  statusCode: 400,
  error: 'Mensagem',
});
```

Os contextos válidos são `LogContext.HTTP | WS | CACHE | SMTP | UPLOAD_FILE | CEP_LOOKUP | CNPJ_LOOKUP`. Cada um tem seu shape de dados em `logger.gateway.ts`.

## Convenções Obrigatórias

- Interface em **`src/infra/<gateway>/<gateway>.gateway.ts`** com nome **`I<Gateway>Gateway`**
- Adapter real em **`adapters/<tecnologia>/<gateway>-<tecnologia>.gateway.ts`**
- Adapter fake em **`adapters/fake/<gateway>-fake.gateway.ts`**
- Module em **`<gateway>.module.ts`** com **`static register()`** (sem `forRoot`/`forFeature`)
- Token em `src/core/di/token.ts` como **`<Gateway>Gateway: Symbol.for('<Gateway>Gateway')`**
- Adapter real captura erros e lança `ExternalApiError` (`src/shared/errors/external-api.error.ts`)
- Adapter real loga via `ILoggerGateway` antes de re-lançar
- DTO de saída do gateway é **independente da tecnologia** (mapeia no adapter real)
- `@Global()` apenas quando o gateway é usado em todo lugar (cache, logger)

## Anti-Padrões (Nunca Faça)

- ❌ Importar lib externa (`redis`, `bullmq`, `@aws-sdk/client-s3`) em `application/` ou `domain/`. Sempre via gateway
- ❌ `XxxModule.forRoot()` ou `XxxModule.forFeature()`. Use **`register()`**
- ❌ Adapter real sem fake correspondente. Toda integração externa precisa de fake para testes
- ❌ Fake que faz I/O. Fakes são síncronos/determinísticos
- ❌ DTO da tecnologia (`ViacepDto`, `CnpjaDto`) vazando para fora do `infra/<gateway>/`. Mapear sempre para o DTO normalizado
- ❌ Ler `process.env` fora de `main.ts` ou `static register()`. Use `ConfigService`
- ❌ Usar `console.log` ou `Logger` do Nest. Sempre `ILoggerGateway`
- ❌ Esquecer de importar `XxxModule.register()` no módulo consumidor

## Exemplo Completo

`AuthenticationGuard` consumindo `ICacheGateway` e `FindAccountById` (use case) — observe como o cache decide se vai ao banco:

```40:57:src/app/authentication/application/guards/authentication/authentication.guard.ts
  private async getAccount(accountId: number): Promise<AccountDto | null> {
    const key = new CacheKeyBuilder()
      .setResource('account')
      .setCommand('detail', accountId.toString())
      .build();

    const cachedAccount = await this.cacheGateway.get<AccountDto>(key);
    if (cachedAccount) {
      return cachedAccount;
    }

    const account = await this.findAccountByIdService.execute(accountId);
    if (account) {
      await this.cacheGateway.set(key, account, 30, true);
    }

    return account;
  }
```

`@Inject(TOKENS.CacheGateway) private readonly cacheGateway: ICacheGateway` no construtor — em produção é `CacheRedisAdapterGateway`, em testes é `CacheFakeAdapterGateway`. Zero código duplicado.
