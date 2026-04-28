---
name: error-handling
description: >-
  Padrão de tratamento de erros do projeto. Toda exceção lançada por
  domínio/use case estende AppException, é capturada por um filter global
  que loga e responde JSON, e nunca usa as exceções nativas do Nest. Use
  ao criar um novo erro tipado, ao decidir o status code, ao logar/sanitizar
  payload, ou quando o usuário disser "criar erro", "lançar exception",
  "retornar 404/409", "tratar erro", "sanitizar password no log",
  "AppException", "Result type", "como o Nest trata meus erros".
---

# Tratamento de Erros

## Contexto

O projeto NÃO usa `Result<T, E>` nem `Either` monad. Erros são lançados via `throw` e capturados por um **filter global** (`HttpExceptionFilter`, registrado via `APP_FILTER` em `FilterModule`). A única classe base permitida é **`AppException`** (em `src/core/filters/app.exception.ts`).

Cada erro de domínio é uma classe filha com mensagem em pt-BR e código HTTP fixo. O filter loga via `ILoggerGateway` (sanitizando campos sensíveis como `password`) e responde `{ message: string }` com o status code definido.

## Estrutura e Localização

```
src/core/filters/
├── app.exception.ts                        # Classe base AppException
├── filter.module.ts                        # Registra HttpExceptionFilter como APP_FILTER
└── http-exception/
    ├── http-exception.filter.ts            # Captura AppException → JSON + log
    └── http-exception.filter.spec.ts

src/shared/errors/                          # Erros transversais (reutilizáveis)
├── document-already-taken.ts
├── email-already-taken.ts
└── external-api.error.ts

src/app/<x>/<modulo>/domain/errors/         # Erros do contexto
└── <razão>.error.ts
```

## Como Fazer

### 1) Classe base

```1:13:src/core/filters/app.exception.ts
export class AppException extends Error {
  private readonly _code?: number;

  constructor(message: string, code?: number) {
    super(message);
    this._code = code;
  }

  public get code(): number | undefined {
    return this._code;
  }
}
```

`code` representa o **status code HTTP**. Se omitido, o filter responde `400`.

### 2) Erro de domínio típico (Not Found = 404)

```1:9:src/app/faq/domain/errors/faq-not-found.error.ts
import { AppException } from 'src/core/filters/app.exception';

export class FaqNotFoundError extends AppException {
  constructor() {
    super('FAQ não encontrado na base de dados.', 404);
    this.name = 'FaqNotFoundError';
  }
}
```

Estrutura: extends + chama `super(mensagemPtBR, codigoHttp)` + `this.name = 'NomeDoErro'`.

### 3) Erro com argumentos (Conflict = 409)

```1:9:src/shared/errors/document-already-taken.ts
import { AppException } from 'src/core/filters/app.exception';

export class DocumentAlreadyTakenError extends AppException {
  constructor(document: string) {
    super(`O documento ${document} já está em uso.`, 409);
    this.name = 'DocumentAlreadyTakenError';
  }
}
```

### 4) Erro de integração externa (Service Unavailable = 503)

```1:9:src/shared/errors/external-api.error.ts
export class ExternalApiError extends AppException {
  constructor(message: string) {
    super(message, 503);
    this.name = 'ExternalApiError';
  }
}
```

### 5) Filter global e sanitização

```9:64:src/core/filters/http-exception/http-exception.filter.ts
@Catch(AppException)
export class HttpExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {
  private readonly SENSITIVE_FIELDS = [
    'password',
  ];

  constructor(@Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway) {
    super();
  }

  public catch(exception: AppException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    this.logger.error(LogContext.HTTP, {
      accountId: (request?.user as any)?.sub,
      method: request.method,
      url: request.url,
      body: this.sanitizeBody(request.body),
      params: request.params,
      query: request.query,
      statusCode: exception.code ?? HttpStatus.BAD_REQUEST,
      error: exception.message,
    });

    response
      .status(exception.code ?? HttpStatus.BAD_REQUEST)
      .json({ message: exception.message });
  }

  private sanitizeBody(body: any): any {
    // ... remove campos sensíveis recursivamente, virando '****'
  }
```

Observações importantes:
- O filter só captura **`AppException`**. Outras exceptions sobem para o filter padrão do Nest e podem virar 500
- O log é estruturado via `ILoggerGateway.error(LogContext.HTTP, {…})`
- O body é sanitizado: `password` vira `'****'` recursivamente

### 6) Códigos HTTP por categoria (convenção observada)

| Categoria | Código | Quando |
|---|---|---|
| Bad Request (default) | `400` | Validação de input não cobre |
| Not Found | `404` | Entidade não existe |
| Conflict | `409` | Email/documento já em uso, sequência tomada |
| Service Unavailable | `503` | API externa fora do ar (CNPJa, ViaCEP) |

### 7) Onde lançar erros

| Camada | Lança? | Tipo |
|---|---|---|
| `domain/entities/<x>.entity.ts` | ✅ | Erros de invariante (`AdminCannotBeInactiveError`) |
| `domain/factories/<x>.factory.ts` | ✅ | Erros de validação de campo (lança VO errors ou erros tipados) |
| `application/usecases/<x>/<x>.service.ts` | ✅ | Existência (`<X>NotFoundError`), unicidade, regras cross-aggregate |
| `infra/driven/persistence/prisma/<x>-prisma.dao.ts` | ❌ | Não lance erros de domínio aqui. Deixe Prisma propagar e o use case decide |
| `infra/drivers/http/<x>-<canal>.controller.ts` | ❌ | Controller não lança. Apenas chama use case |

### 8) Erro de domínio sem args (sem código → 400 implícito)

Quando o status default `400` é apropriado, omita o segundo argumento:

```typescript
import { AppException } from 'src/core/filters/app.exception';

export class ClientCannotBeSelfParentError extends AppException {
  constructor() {
    super('Um cliente não pode ser pai de si mesmo.');
    this.name = 'ClientCannotBeSelfParentError';
  }
}
```

### 9) Erros vindos de VOs

VOs (`Email`, `CNPJ`, `NonEmptyString`) lançam erros próprios — por convenção, ficam ao lado do VO:

```
src/shared/value-objects/
├── email/email.vo.ts
└── email/email.error.ts          # InvalidEmailError extends AppException
```

Como VOs são chamados pela Factory (no domínio), o erro propaga até o use case e até o filter — sem necessidade de try/catch intermediário.

## Convenções Obrigatórias

- TODA exceção do projeto **`extends AppException`**
- Mensagem **em português** (`'FAQ não encontrado na base de dados.'`)
- `this.name = '<NomeDoErro>'` no construtor (ajuda em logs e debug)
- Código HTTP correto (404 não-encontrado, 409 conflito, 503 indisponível, default 400)
- Erros do domínio em `src/app/<x>/<modulo>/domain/errors/<razão>.error.ts` (kebab-case)
- Erros transversais em `src/shared/errors/`
- Erros de VO ficam ao lado do VO (`<vo>.error.ts`)
- Filter global é único e captura `AppException`
- Sanitizar campos sensíveis (atualmente `password`) — extender a lista `SENSITIVE_FIELDS` em `http-exception.filter.ts` se necessário

## Anti-Padrões (Nunca Faça)

- ❌ `throw new BadRequestException(...)` ou outras exceptions de `@nestjs/common`
- ❌ `throw new Error('...')` direto. Sempre tipo concreto extendendo `AppException`
- ❌ Mensagens em inglês na mensagem de erro do `super(...)`
- ❌ `try/catch` que engole erro silenciosamente. Se o erro for esperado, faça rollback explícito (saga compensatória) e re-lance
- ❌ Lançar erro de domínio dentro do DAO. DAO não conhece o conceito de "não encontrado é 404 ou 200 vazio?" — quem decide é o use case
- ❌ Retornar `null`/`undefined` em situações de erro. Lance um erro explícito
- ❌ Logar `request.body` sem sanitizar. Use o filter já implementado
- ❌ Definir mais de uma estratégia de erro no projeto (Result, Either, AppException). Padrão é só **AppException**

## Exemplo Completo

Trecho de use case com tratamento canônico:

```32:60:src/app/admin/application/usecases/create-admin/create-admin.service.ts
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
```

Pipeline observável:
1. Use case lança `EmailAlreadyTakenError` (extends AppException, code 409)
2. Filter captura, sanitiza body, loga via Winston, responde:
   ```json
   { "message": "O email john@x.com já está em uso." }
   ```
   com status `409`
