---
name: audit-flow
description: >-
  Fluxo de auditoria do projeto. Cobre o `AuditInterceptor` global
  (registrado em `AuditModule` via `APP_INTERCEPTOR`) que captura
  automaticamente toda mutação HTTP (POST/PATCH/PUT/DELETE), sanitiza
  campos sensíveis, persiste em `audit_logs` via `IAuditLogDao` e
  `AuditLogDaoAdapterPrisma`, e o endpoint admin `GET /admin/audit-log`
  protegido por `@RequiredRoles(ADMIN)` + `@RequiredClaims(AUDIT_READ)`
  com filtros (accountId, method, search, startDate, endDate). Use
  SEMPRE que precisar entender o que é logado, adicionar um campo
  sensível, expor um novo filtro de auditoria, debugar por que uma
  rota não aparece nos logs, ou quando o usuário disser "auditoria",
  "audit", "audit log", "log de mutação", "rastrear ação", "quem
  alterou", "interceptor de auditoria", "AuditInterceptor",
  "AuditModule", "audit_logs", "x-forwarded-for", "sanitizar password",
  "campo sensível", "fire-and-forget", "logar requisição",
  "interceptor global".
---

# Fluxo de Auditoria

## Contexto

O projeto registra automaticamente toda **mutação HTTP** (POST, PATCH, PUT, DELETE) numa tabela `audit_logs`. O design tem três premissas:

1. **Transparente para as features** — nenhum controller/use case precisa "lembrar" de auditar. O `AuditInterceptor` está em `APP_INTERCEPTOR` e roda em **todas** as rotas do app.
2. **Não deve quebrar a requisição** — persistência é **fire-and-forget**: erro do banco de auditoria nunca propaga para o cliente.
3. **Não vaza segredo** — campos `password`, `passwordHash`, `token`, `secret` no body são substituídos por `'****'` antes de gravar.

Hoje o interceptor **só loga respostas com sucesso** (via `tap`). O bloco `catchError` está comentado em `audit.interceptor.ts:41-45` — decisão deliberada para não poluir a auditoria com tentativas inválidas (4xx/5xx). Se isso mudar, atualize esta skill.

A leitura dos logs é **exclusiva de admin** com claim `AUDIT_READ`. Não há endpoint de criação manual nem de delete (logs são imutáveis pelo design).

Módulo de referência: `src/app/audit/`. É um módulo **simples** (DAO + use case + controller), sem entidade rica nem repository — segue o padrão CRUD descrito em `.cursor/skills/dao-pattern/SKILL.md`.

## Estrutura e Localização

```
src/app/audit/
├── audit.module.ts                                        # registra AuditInterceptor em APP_INTERCEPTOR
├── application/
│   ├── dtos/
│   │   └── audit-log.dto.ts                               # AuditLogDto (output)
│   ├── persistence/
│   │   ├── audit-persistence.module.ts                    # binding TOKENS.AuditLogDao → AuditLogDaoAdapterPrisma
│   │   └── dao/
│   │       └── audit-log-dao.interface.ts                 # IAuditLogDao + CreateAuditLogData
│   └── usecases/
│       └── find-all-audit-log/
│           ├── find-all-audit-log.service.ts              # FindAllAuditLog (use case)
│           ├── find-all-audit-log.service.spec.ts
│           └── dtos/
│               └── find-all-audit-log.dto.ts              # FindAllAuditLogQueryDto extends Queries
└── infra/
    ├── interceptors/
    │   ├── audit.interceptor.ts                           # AuditInterceptor (NestInterceptor)
    │   └── audit.interceptor.spec.ts
    └── driven/persistence/prisma/
    │   ├── audit-log-prisma.dao.ts                        # AuditLogDaoAdapterPrisma
    │   └── audit-log-prisma.dao.spec.ts
    └── drivers/http/admin/
        ├── audit-log-admin.controller.ts                  # GET /admin/audit-log
        └── audit-log-admin.controller.spec.ts

prisma/schema/audit.prisma                                 # model AuditLog (@@map "audit_logs")

src/core/di/token.ts                                       # TOKENS.AuditLogDao
src/app/authentication/domain/authorization/claim.ts       # Claim.AUDIT_READ / AUDIT_WRITE
src/app/authentication/domain/authorization/claim-subject.enum.ts  # ClaimSubject.Audit
```

## Como Fazer

### 0) Cenário comum: NÃO FAZER NADA

Para 99% das features novas, você **não precisa tocar em nada de auditoria**. Basta criar a rota mutante normalmente (POST/PATCH/PUT/DELETE) seguindo `.cursor/skills/controllers-and-swagger/SKILL.md` — o `AuditInterceptor` já intercepta porque é `APP_INTERCEPTOR`.

Vai aparecer automaticamente em `audit_logs` com:
- `accountId` = `request.user.sub` (ou `null` se a rota for pública)
- `method`, `url`, `params`, `body` (sanitizado), `statusCode`, `ip`
- `createdAt` = agora

Se a rota é **pública** (sem `@User` exigido), o interceptor ainda loga, mas com `accountId: null`.

### 1) Anatomia do `AuditInterceptor`

Arquivo canônico:

```1:53:src/app/audit/infra/interceptors/audit.interceptor.ts
import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { TOKENS } from 'src/core/di/token';
import type { IAuditLogDao } from '../../application/persistence/dao/audit-log-dao.interface';

const MUTATING_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];
const SENSITIVE_FIELDS = ['password', 'passwordHash', 'token', 'secret'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Inject(TOKENS.AuditLogDao) private readonly auditLogDao: IAuditLogDao,
  ) {}

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, params } = request;

    if (!MUTATING_METHODS.includes(method)) {
      return next.handle();
    }

    const accountId: number | null = (request.user as Payload)?.sub ?? null;
    const ip = (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
      ?? request.ip
      ?? null;
    const sanitizedBody = this.sanitizeBody(body);
    const sanitizedParams = Object.keys(params ?? {}).length > 0
      ? (params as Record<string, unknown>)
      : null;

    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        const statusCode = response.statusCode;
        this.saveLog({ accountId, method, url, params: sanitizedParams, body: sanitizedBody, statusCode, ip });
      }),
    );
  }

  private saveLog(data: Parameters<IAuditLogDao['save']>[0]): void {
    this.auditLogDao.save(data).catch(() => {
      // fire-and-forget: erros de auditoria não devem interromper a requisição
    });
  }
```

Pontos-chave:
- **Filtra por método HTTP** logo no início (`!MUTATING_METHODS.includes(method)`) — `GET`/`HEAD`/`OPTIONS` saem sem custo.
- **`accountId` vem do `request.user`** populado pelo `JwtAuthGuard`. Se a rota não exige autenticação, `request.user` é `undefined` e cai pra `null` (não quebra).
- **IP**: prioriza o **primeiro valor** de `X-Forwarded-For` (split por vírgula + trim) e cai para `request.ip`. Em produção atrás de proxy, é o IP do cliente real; em dev local, é `::1` ou `127.0.0.1`.
- **`sanitizedParams`**: se `params` está vazio, salva `null` (evita `{}`).
- **`tap()`**: só dispara após o handler completar com sucesso. Se o use case lançar, o `tap` não roda e nada é gravado.
- **`saveLog` engole o erro do DAO** (`.catch(() => {})`). Esse é o ponto fail-closed da auditoria — nunca derruba a request.

### 2) Module: `AuditModule`

Registra o interceptor como global (`APP_INTERCEPTOR`), o controller admin e o use case.

```1:29:src/app/audit/audit.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { AuditPersistenceModule } from './application/persistence/audit-persistence.module';
import { FindAllAuditLog } from './application/usecases/find-all-audit-log/find-all-audit-log.service';
import { AuditLogAdminController } from './infra/drivers/http/admin/audit-log-admin.controller';
import { AuditInterceptor } from './infra/interceptors/audit.interceptor';

@Module({
  imports: [
    AuditPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    AuditLogAdminController,
  ],
  providers: [
    FindAllAuditLog,
    AuditInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [
    AuditInterceptor,
  ],
})
export class AuditModule {}
```

`AuditModule` é importado **uma única vez** em `src/app.module.ts` e isso é o suficiente — o `APP_INTERCEPTOR` é resolvido pelo Nest globalmente.

### 3) Persistência: schema, DAO e adapter

Schema Prisma (`prisma/schema/audit.prisma`) — JSON nullable em `params` e `body`:

```1:13:prisma/schema/audit.prisma
model AuditLog {
  id         Int      @id @default(autoincrement())
  accountId  Int?
  method     String
  url        String
  params     Json?
  body       Json?
  statusCode Int
  ip         String?
  createdAt  DateTime @default(now())

  @@map("audit_logs")
}
```

Interface DAO + payload tipado:

```1:17:src/app/audit/application/persistence/dao/audit-log-dao.interface.ts
import { AuditLogDto } from '../../dtos/audit-log.dto';
import { FindAllAuditLogQueryDto } from '../../usecases/find-all-audit-log/dtos/find-all-audit-log.dto';

export type CreateAuditLogData = {
  accountId: number | null;
  method: string;
  url: string;
  params: Record<string, unknown> | null;
  body: Record<string, unknown> | null;
  statusCode: number;
  ip: string | null;
};

export interface IAuditLogDao {
  save(data: CreateAuditLogData): Promise<void>;
  findAll(queries: FindAllAuditLogQueryDto): Promise<[AuditLogDto[], number]>;
}
```

Adapter Prisma — atenção ao tratamento de `Json | null` (precisa de `Prisma.JsonNull`, não `null`):

```20:32:src/app/audit/infra/driven/persistence/prisma/audit-log-prisma.dao.ts
@Injectable()
export class AuditLogDaoAdapterPrisma implements IAuditLogDao {
  constructor(private readonly prisma: PrismaService) {}

  public async save(data: CreateAuditLogData): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        ...data,
        params: data.params != null ? (data.params as Prisma.InputJsonValue) : Prisma.JsonNull,
        body: data.body != null ? (data.body as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }
```

`findAll` segue o padrão **`conditions[] + AND`** descrito em `.cursor/skills/dao-pattern/SKILL.md` seção 3:

```37:70:src/app/audit/infra/driven/persistence/prisma/audit-log-prisma.dao.ts
    const conditions: Prisma.AuditLogWhereInput[] = [];

    if (queries.accountId != null) {
      conditions.push({ accountId: queries.accountId });
    }

    if (queries.method) {
      conditions.push({ method: queries.method });
    }

    if (queries.search?.trim()) {
      conditions.push({ url: { contains: queries.search.trim(), mode: 'insensitive' } });
    }

    if (queries.startDate) {
      conditions.push({ createdAt: { gte: new Date(queries.startDate) } });
    }

    if (queries.endDate) {
      conditions.push({ createdAt: { lte: new Date(queries.endDate) } });
    }

    const where: Prisma.AuditLogWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        select: AuditLogSelect,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
```

Token DI registrado em `src/core/di/token.ts`:

```typescript
const TOKENS = {
  AuditLogDao: Symbol.for('AuditLogDao'),
  // ...
};
```

E o binding fica em `audit-persistence.module.ts`:

```1:18:src/app/audit/application/persistence/audit-persistence.module.ts
import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { AuditLogDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/audit-log-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.AuditLogDao,
    useClass: AuditLogDaoAdapterPrisma,
  },
];
```

### 4) Endpoint de leitura

Controller admin com filtros via DTO:

```12:30:src/app/audit/infra/drivers/http/admin/audit-log-admin.controller.ts
@Controller('admin/audit-log')
@RequiredRoles(AccountRole.ADMIN)
export class AuditLogAdminController {
  constructor(
    private readonly findAllAuditLog: FindAllAuditLog,
  ) {}

  @Get()
  @RequiredClaims(Claim.AUDIT_READ)
  @Swagger({
    tags: ['Auditoria'],
    summary: 'Listar logs de auditoria com paginação e filtros',
    applyBadRequest: true,
    okPaginatedResponse: AuditLogDto,
  })
  public findAll(@Query() queries: FindAllAuditLogQueryDto): Promise<IPagination<AuditLogDto>> {
    return this.findAllAuditLog.execute(queries);
  }
}
```

DTO de filtros estende `Queries` (page, size, search) e adiciona campos específicos da auditoria:

```1:31:src/app/audit/application/usecases/find-all-audit-log/dtos/find-all-audit-log.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { StringToNumber } from 'src/infra/validators/class/decorators/string-number/string-number';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllAuditLogQueryDto extends Queries {
  @ApiPropertyOptional({ description: 'Filtrar por ID da conta que realizou a ação' })
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  accountId?: number;

  @ApiPropertyOptional({ enum: ['POST', 'PATCH', 'PUT', 'DELETE'], description: 'Filtrar por método HTTP' })
  @IsOptional()
  @IsString({ message: '$property deve ser uma string' })
  @IsIn(['POST', 'PATCH', 'PUT', 'DELETE'], { message: '$property deve ser POST, PATCH, PUT ou DELETE' })
  @Trim()
  method?: string;

  @ApiPropertyOptional({ example: '2025-01-01', description: 'Data inicial (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: '$property deve ser uma data válida no formato ISO 8601' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Data final (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: '$property deve ser uma data válida no formato ISO 8601' })
  endDate?: string;
}
```

`search` herda de `Queries` e busca em `url` (case-insensitive). O use case é trivial — só pagina o resultado:

```9:19:src/app/audit/application/usecases/find-all-audit-log/find-all-audit-log.service.ts
@Injectable()
export class FindAllAuditLog {
  constructor(
    @Inject(TOKENS.AuditLogDao) private readonly auditLogDao: IAuditLogDao,
  ) {}

  public async execute(queries: FindAllAuditLogQueryDto): Promise<IPagination<AuditLogDto>> {
    const [result, total] = await this.auditLogDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
```

### 5) Customizações comuns

#### 5.1) Adicionar campo sensível à lista de sanitização

Edite `SENSITIVE_FIELDS` em `audit.interceptor.ts` (constante no topo do arquivo). Caixa **importa**: a chave do body é comparada exatamente.

```typescript
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'secret',
  'newPassword',     // <- adicione
  'creditCardNumber',
];
```

Atualize o teste de sanitização em `audit.interceptor.spec.ts` (caso `should sanitize sensitive fields in body`).

> ⚠️ A sanitização hoje **não é recursiva** — só inspeciona o nível raiz do body e só substitui se a chave existir e for de objeto plano (não array). Se o body é `{ user: { password: 'x' } }`, o `password` aninhado **não é** mascarado. Ao adicionar um campo aninhado, refatore `sanitizeBody` para recursão (ou passe o aninhamento para o nível raiz no DTO).

#### 5.2) Adicionar um filtro novo no `findAll`

Quatro arquivos sempre na mesma ordem:

1. **DTO** (`find-all-audit-log.dto.ts`) — adicione o campo opcional com `@IsOptional()`, validação e `@ApiPropertyOptional`. Veja convenções em `.cursor/skills/dto-and-validation/SKILL.md`.
2. **DAO Prisma** (`audit-log-prisma.dao.ts`) — empurre uma nova condição em `conditions.push(...)`.
3. **Spec do use case** (`find-all-audit-log.service.spec.ts`) — passe o filtro no objeto `queries` e verifique que o DAO recebeu.
4. **Spec do DAO integração** (`audit-log-prisma.dao.spec.ts`) — fixture com 2-3 linhas e asserção no resultado filtrado.

Exemplo: filtrar por faixa de `statusCode`:

```typescript
@ApiPropertyOptional({ description: 'Filtrar por código de status mínimo' })
@IsOptional()
@IsInt() @StringToNumber()
minStatusCode?: number;

if (queries.minStatusCode != null) {
  conditions.push({ statusCode: { gte: queries.minStatusCode } });
}
```

#### 5.3) Auditar erros (4xx/5xx) também

Hoje o `tap()` ignora erros. Para registrar tentativas falhas, descomente o `catchError` em `audit.interceptor.ts:41-45` e ajuste:

```typescript
import { catchError, tap, throwError } from 'rxjs';
// ...
return next.handle().pipe(
  tap(() => {
    const statusCode = response.statusCode;
    this.saveLog({ accountId, method, url, params: sanitizedParams, body: sanitizedBody, statusCode, ip });
  }),
  catchError((err: unknown) => {
    const statusCode = (err as { status?: number; code?: number })?.status
      ?? (err as { status?: number; code?: number })?.code
      ?? 500;
    this.saveLog({ accountId, method, url, params: sanitizedParams, body: sanitizedBody, statusCode, ip });
    return throwError(() => err);
  }),
);
```

E **adicione um teste** confirmando que o erro continua propagando após o save (já existe um stub em `audit.interceptor.spec.ts:201-213` — `should re-throw the error after saving log`).

> Decisão registrada: o time hoje optou por **não logar falhas** para manter o `audit_logs` enxuto e focado em "o que aconteceu de verdade no sistema". Mude com cautela e atualize esta skill.

#### 5.4) Excluir uma rota da auditoria

Não há decorator `@SkipAudit` no projeto. Se for necessário, adicione um `Reflector.get(AUDIT_SKIP_KEY, context.getHandler())` no início do `intercept` e crie o decorator em `src/app/audit/infra/decorators/skip-audit.decorator.ts`. Use só para rotas internas/healthcheck — toda mutação real **deve** ser auditada.

#### 5.5) Acessar o DAO de outro módulo (ex.: gravar log custom)

Importe `AuditPersistenceModule`:

```typescript
imports: [AuditPersistenceModule],
providers: [
  // seu use case
],
```

E injete:

```typescript
@Inject(TOKENS.AuditLogDao) private readonly auditLogDao: IAuditLogDao,
```

Mas **antes**, pergunte se realmente precisa: 99% dos casos a interceptação automática cobre. Logs manuais quebram a uniformidade do esquema (`method`/`url` deixam de ter sentido).

### 6) Testes

Três níveis, todos já existentes — replique o estilo:

#### 6.1) Interceptor (unit)

`audit.interceptor.spec.ts` constrói um `ExecutionContext` mockado via `createMock` e fabrica `Request`/`Response` parciais:

```10:47:src/app/audit/infra/interceptors/audit.interceptor.spec.ts
function buildContext(overrides: Partial<{
  method: string;
  url: string;
  body: unknown;
  params: Record<string, string>;
  headers: Record<string, string>;
  ip: string;
  userSub: number | null;
  statusCode: number;
}>): ExecutionContext {
  const {
    method = 'POST',
    url = '/admin/client',
    body = {},
    params = {},
    headers = {},
    ip = '10.0.0.1',
    userSub = null,
    statusCode = 201,
  } = overrides;

  const request = {
    method,
    url,
    body,
    params,
    headers,
    ip,
    user: userSub != null ? { sub: userSub } : undefined,
  } as unknown as Request;

  const response = { statusCode } as unknown as Response;

  const ctx = createMock<ExecutionContext>();
  ctx.switchToHttp().getRequest.mockReturnValue(request);
  ctx.switchToHttp().getResponse.mockReturnValue(response);
  return ctx;
}
```

Cubra **sempre** estes casos ao mexer no interceptor:
- `GET` não chama `save`
- Cada `MUTATING_METHODS` (`POST`/`PATCH`/`PUT`/`DELETE`) chama `save` 1×
- `accountId: null` quando `request.user` é `undefined`
- `params: { id: '5' }` quando o request tem path params
- `X-Forwarded-For` tem precedência sobre `request.ip`
- Campos sensíveis viram `'****'`
- Erro do handler **propaga** (re-throw)
- Erro do `auditLogDao.save` **NÃO** quebra a request (fire-and-forget)

#### 6.2) Use case (unit)

Padrão `createMock<IAuditLogDao>()` + asserções em `result.totalItems`/`result.data`:

```13:42:src/app/audit/application/usecases/find-all-audit-log/find-all-audit-log.service.spec.ts
beforeEach(async() => {
  const module = await Test.createTestingModule({
    providers: [
      FindAllAuditLog,
      { provide: TOKENS.AuditLogDao, useValue: createMock<IAuditLogDao>() },
    ],
  }).compile();

  sut = module.get(FindAllAuditLog);
  auditLogDao = module.get(TOKENS.AuditLogDao);
});

it('should be defined', () => {
  expect(sut).toBeDefined();
});

it('should call dao.findAll with queries and return paginated result', async() => {
  const queries: FindAllAuditLogQueryDto = { page: 1, size: 10 };
  const log = createMock<AuditLogDto>({ id: 1 });
  jest.spyOn(auditLogDao, 'findAll').mockResolvedValue([[log], 1]);

  const result = await sut.execute(queries);

  expect(auditLogDao.findAll).toHaveBeenCalledWith(queries);
  expect(result.data).toEqual([log]);
  expect(result.totalItems).toBe(1);
  expect(result.currentPage).toBe(1);
  expect(result.itemsPerPage).toBe(10);
  expect(result.totalPages).toBe(1);
});
```

#### 6.3) DAO (integration, banco real)

Limpa antes/depois com `prisma.auditLog.deleteMany()`. Use 3 fixtures com `createdAt` diferentes para validar `orderBy desc`, `startDate`, `endDate`:

```20:27:src/app/audit/infra/driven/persistence/prisma/audit-log-prisma.dao.spec.ts
beforeEach(async() => {
  await prisma.auditLog.deleteMany();
});

afterAll(async() => {
  await prisma.auditLog.deleteMany();
  await prisma.$disconnect();
});
```

Cubra cada filtro do DTO (`accountId`, `method`, `search`, `startDate`, `endDate`) + combinação + paginação + retorno vazio. Veja `.cursor/skills/testing-strategy/SKILL.md` para o padrão geral.

#### 6.4) Controller (unit)

Importa `AuthenticationGuardsModule`, mocka o use case, valida o roteamento simples:

```14:25:src/app/audit/infra/drivers/http/admin/audit-log-admin.controller.spec.ts
beforeEach(async() => {
  const module = await Test.createTestingModule({
    imports: [AuthenticationGuardsModule],
    controllers: [AuditLogAdminController],
    providers: [
      { provide: FindAllAuditLog, useValue: createMock<FindAllAuditLog>() },
    ],
  }).compile();

  sut = module.get(AuditLogAdminController);
  findAllAuditLogService = module.get(FindAllAuditLog);
});
```

## Convenções Obrigatórias

- **Interceptor único e global**: apenas `AuditInterceptor` em `APP_INTERCEPTOR`. Não duplique a lógica em outros interceptors.
- **Apenas mutações**: `MUTATING_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE']`. **Nunca** logue `GET` (custo + privacidade).
- **Fire-and-forget**: `auditLogDao.save(...).catch(() => {})`. Erro de auditoria NUNCA propaga.
- **Sanitização no nível raiz**: `password`, `passwordHash`, `token`, `secret` viram `'****'`. Para campo aninhado, refatore `sanitizeBody` (hoje é shallow).
- **`accountId` opcional**: rotas públicas geram log com `accountId: null` — não force que toda rota tenha usuário.
- **IP de proxy**: sempre considerar `X-Forwarded-For` primeiro (split por `,` + `trim`), fallback para `request.ip`.
- **`Json` nullable**: ao salvar via Prisma, use `Prisma.JsonNull` (não `null` literal) para `params`/`body` ausentes — exigência da tipagem do Prisma.
- **Endpoint de leitura**: sempre **`/admin/audit-log`**, sempre com `@RequiredRoles(ADMIN)` + `@RequiredClaims(AUDIT_READ)`. Nunca exponha em `/user/...`.
- **Não há endpoint de delete**: logs são **append-only** pelo design. Para retenção/expurgo, use job de banco/cron externo.
- **DAO + use case (não DDD)**: este é módulo CRUD-simples. Não crie `AuditLog` entity, não crie factory, não crie repository — segue `.cursor/skills/dao-pattern/SKILL.md`.
- **Token único**: `TOKENS.AuditLogDao`. Não crie tokens novos para variantes — use o mesmo DAO.
- **Tag Swagger**: `'Auditoria'` (português). Mantenha consistente.
- **`Claim.AUDIT_WRITE`** existe no catálogo mas hoje **não é usado** (logs são gravados pelo sistema, não pelo usuário). Reservado para futura escrita manual; **não atribua** a admins até existir endpoint que o requeira.

## Anti-Padrões (Nunca Faça)

- ❌ Logar `GET` "para auditar leituras". O projeto rastreia **mutações**; leituras (com filtros sensíveis) seriam ruído + LGPD risk. Se precisar, use logs estruturados de aplicação (`Winston`), não a tabela de auditoria.
- ❌ Lançar erro do `saveLog` sem capturar. Quebra a request por causa de um log que ninguém vai ler em tempo real.
- ❌ Acessar `request.body` direto no DAO ou use case para "logar manualmente". O interceptor já fez isso uma vez — duplicar gera log redundante e divergente.
- ❌ Adicionar campo sensível no body **sem** atualizar `SENSITIVE_FIELDS`. Vaza segredo no banco.
- ❌ Persistir o **resultado** do handler (response body) em `audit_logs`. Hoje só registra `statusCode` — gravar payload de saída pode vazar dados de outros usuários (ex.: relatório retornado).
- ❌ Filtrar `request.url` por feature (`if (url.startsWith('/admin')) save()`). O interceptor é uniforme — exclusões devem ser explícitas via decorator.
- ❌ Importar `AuditModule` dentro de outras features para "logar mais coisa". O `APP_INTERCEPTOR` já está globalmente ativo; importar de novo cria conflitos de provider.
- ❌ Trocar `tap` por `finalize` esperando logar tanto sucesso quanto erro. `finalize` perde o `statusCode` real do erro (response status pode estar desatualizado). Use `catchError` explícito (ver 5.3) se for esse o objetivo.
- ❌ Sanitizar via mutação no `body` original (`body.password = '****'` direto). O interceptor faz `{ ...body }` e altera a cópia — nunca toque no objeto que o handler vai receber.
- ❌ Usar `AppException` ou `HttpExceptionFilter` para mascarar erros do `save`. O `.catch(() => {})` é proposital e local — mantenha simples.
- ❌ Adicionar índices ao `audit_logs` sem medir. A tabela cresce rápido; índice errado custa em todo INSERT. Hoje não há índices customizados; se for adicionar, cubra os filtros do `findAll` (`accountId`, `method`, `createdAt`).

## Exemplo Completo

Cenário: a equipe de segurança pede para registrar **também** a `userAgent` do request, mascarar o campo `apiKey` e adicionar um filtro `userAgent` no endpoint de listagem.

1. **Migration Prisma** — adicionar coluna `userAgent String?` em `audit.prisma`:

   ```
   model AuditLog {
     // ...
     userAgent  String?
     createdAt  DateTime @default(now())
     @@map("audit_logs")
   }
   ```

   Rode `pnpm prisma db push` (ou migration formal — ver `.cursor/skills/prisma-conventions/SKILL.md`).

2. **`CreateAuditLogData`** em `audit-log-dao.interface.ts` — adicionar `userAgent: string | null;`.

3. **`AuditLogDto`** em `audit-log.dto.ts` — adicionar `userAgent: string | null;`.

4. **`AuditInterceptor`** — extrair `userAgent` do header e adicionar à lista de sensíveis:

   ```typescript
   const SENSITIVE_FIELDS = ['password', 'passwordHash', 'token', 'secret', 'apiKey'];
   // ...
   const userAgent = (request.headers['user-agent'] as string | undefined)?.slice(0, 500) ?? null;
   // ...
   this.saveLog({ accountId, method, url, params: sanitizedParams, body: sanitizedBody, statusCode, ip, userAgent });
   ```

   (Trunque para evitar UAs gigantes de bots.)

5. **`AuditLogSelect`** + `save` em `audit-log-prisma.dao.ts` — incluir `userAgent: true` no select e o campo passa naturalmente no `data: { ...data }` do `create`.

6. **`FindAllAuditLogQueryDto`** — adicionar:

   ```typescript
   @ApiPropertyOptional({ description: 'Filtrar por trecho do user-agent' })
   @IsOptional() @IsString() @Trim()
   userAgent?: string;
   ```

7. **`findAll` no DAO** — push da condição:

   ```typescript
   if (queries.userAgent?.trim()) {
     conditions.push({ userAgent: { contains: queries.userAgent.trim(), mode: 'insensitive' } });
   }
   ```

8. **Specs**:
   - `audit.interceptor.spec.ts`: novo caso `should save user-agent from headers` + um caso para `apiKey` mascarado.
   - `find-all-audit-log.service.spec.ts`: passar `userAgent` em queries de teste.
   - `audit-log-prisma.dao.spec.ts`: fixtures com `userAgent` distintos + assertion no filtro.

9. **Smoke**: `pnpm lint && pnpm test:unit` + integration do DAO.

Resultado: ~6 arquivos modificados, sem mudar arquitetura. O `APP_INTERCEPTOR` continua o mesmo e não há novo módulo a importar.

> Se a feature pedir algo que **muda o contrato** (ex.: split de tabela por tenant, replicação para data lake, retenção automática), abra discussão antes — esse fluxo é central e qualquer alteração impacta toda a aplicação.
