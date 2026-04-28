---
name: controllers-and-swagger
description: >-
  Padrão de controllers HTTP do projeto (separação admin/user, decorator
  @Swagger custom, métodos canônicos). Use ao criar/modificar controller
  REST, ao documentar endpoints OpenAPI, ao decidir entre controller
  admin e user, ao definir paths/params/responses, ou quando o usuário
  disser "criar controller", "criar endpoint", "documentar API",
  "Swagger", "OpenAPI", "rota POST/PATCH/GET/DELETE", "tag do swagger",
  "rota pública vs admin".
---

# Controllers e Swagger

## Contexto

Controllers são **adapters de entrada (drivers)** em `infra/drivers/http/`. Eles **apenas adaptam HTTP → use case** — nunca contêm lógica de negócio. Cada feature tem geralmente dois controllers:

- **`<modulo>-admin.controller.ts`** — em `infra/drivers/http/admin/`, com path `'admin/<modulo>'` e protegido por `@RequiredRoles(AccountRole.ADMIN)`
- **`<modulo>-user.controller.ts`** — em `infra/drivers/http/user/`, com path `'user/<modulo>'`, geralmente público (somente leitura)

A documentação OpenAPI usa um **decorator custom `@Swagger({...})`** (em `src/infra/openapi/swagger.ts`) que aplica ao mesmo tempo `@ApiOperation`, `@ApiTags`, `@ApiOkResponse`, paginação, badRequest, etc. **Não use `@ApiOperation` direto** — sempre via `@Swagger`.

## Estrutura e Localização

```
src/app/<x>/<modulo>/infra/drivers/http/
├── admin/
│   ├── <modulo>-admin.controller.ts
│   └── <modulo>-admin.controller.spec.ts
└── user/
    ├── <modulo>-user.controller.ts
    └── <modulo>-user.controller.spec.ts

src/infra/openapi/
├── swagger.ts                                # Decorator @Swagger custom
└── error.dto.ts                              # ClientError, ServerError
```

## Como Fazer

### 1) Métodos HTTP canônicos (referência: FAQ admin)

Convenção da ordem em CRUD admin:

| Verbo HTTP | Path | Método | Decorator |
|---|---|---|---|
| `POST` | `/` | `create` | `@Post()` |
| `GET` | `/` | `findAll` | `@Get()` |
| `GET` | `/:id` | `findOne` | `@Get(':id')` |
| `PATCH` | `/:id/status` | `updateStatus` | `@Patch(':id/status')` (ANTES de `:id`) |
| `PATCH` | `/:id/activate` | `activate` | `@Patch(':id/activate')` (ANTES de `:id`) |
| `PATCH` | `/:id/deactivate` | `deactivate` | `@Patch(':id/deactivate')` (ANTES de `:id`) |
| `PATCH` | `/:id` | `update` | `@Patch(':id')` |
| `DELETE` | `/:id` | `remove` | `@Delete(':id')` |

⚠️ **Ordem importa**: rotas mais específicas (`:id/status`, `:id/activate`) DEVEM vir **antes** de `:id` genérico, ou o Nest casa pelo path-param sem encontrar o sub-recurso.

### 2) Decorator `@Swagger`

Assinatura completa:

```typescript
@Swagger({
  tags: ['Categoria'],                    // ApiTags
  summary: 'Descrição curta',             // ApiOperation summary
  description: 'Descrição longa opcional',
  okResponse: FaqDto,                     // 200 OK com tipo
  okPaginatedResponse: FaqDto,            // 200 OK com IPagination<FaqDto>
  createdResponse: CreateFaqOutputDto,    // 201 Created
  applyBadRequest: true,                  // 400 com ClientError
  applyForbidden: true,                   // 403
  applyNotFound: true,                    // 404
  applyConflict: true,                    // 409
  applyUnsupportedMediaType: true,        // 415
  applyServiceUnavailable: true,          // 503
  mergeRequestBody: [DtoA, DtoB],         // body com allOf de múltiplos DTOs
})
```

`ApiInternalServerErrorResponse` (500) é aplicado **automaticamente** em toda rota que usa `@Swagger`.

### 3) Padrão completo de método de criação

```33:43:src/app/faq/infra/drivers/http/admin/faq-admin.controller.ts
  @Post()
  @RequiredClaims(Claim.FAQ_WRITE)
  @Swagger({
    tags: ['FAQs'],
    summary: 'Criar nova FAQ',
    applyBadRequest: true,
    createdResponse: CreateFaqOutputDto,
  })
  public create(@Body() body: CreateFaqInputDto): Promise<CreateFaqOutputDto> {
    return this.createFaq.execute(body);
  }
```

### 4) Padrão de listagem paginada

```45:55:src/app/faq/infra/drivers/http/admin/faq-admin.controller.ts
  @Get()
  @RequiredClaims(Claim.FAQ_READ)
  @Swagger({
    tags: ['FAQs'],
    summary: 'Listar FAQs com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: FaqDto,
  })
  public findAll(@Query() queries: FindAllFaqQueryDto): Promise<IPagination<FaqDto>> {
    return this.findAllFaq.execute(queries);
  }
```

### 5) Padrão de busca por ID

```57:68:src/app/faq/infra/drivers/http/admin/faq-admin.controller.ts
  @Get(':id')
  @RequiredClaims(Claim.FAQ_READ)
  @Swagger({
    tags: ['FAQs'],
    summary: 'Buscar FAQ por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: FaqDto,
  })
  public findOne(@Param() params: Params): Promise<FaqDto> {
    return this.findFaqById.execute(params.id);
  }
```

Use sempre `@Param() params: Params` (DTO importado de `src/infra/validators/class/dtos/params/params.dto.ts`) — ele já valida e transforma `params.id` em `number` positivo.

### 6) Sub-rota `:id/status` (toggle)

```70:81:src/app/faq/infra/drivers/http/admin/faq-admin.controller.ts
  @Patch(':id/status')
  @RequiredClaims(Claim.FAQ_WRITE)
  @Swagger({
    tags: ['FAQs'],
    summary: 'Inverter status ativo da FAQ',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateFaqStatus.execute(params.id);
  }
```

### 7) Controller user (público, somente leitura)

```8:24:src/app/faq/infra/drivers/http/user/faq-user.controller.ts
@Controller('user/faq')
export class FaqUserController {
  constructor(
    private readonly findAllFaq: FindAllFaq,
  ) {}

  @Get()
  @Swagger({
    tags: ['FAQs - Público'],
    summary: 'Listar FAQs com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: FaqDto,
  })
  public findAll(@Query() queries: FindAllFaqQueryDto): Promise<IPagination<FaqDto>> {
    return this.findAllFaq.execute(queries);
  }
}
```

Sem `@RequiredRoles` ⇒ rota pública.

### 8) Sub-rotas de ativar/desativar (DDD)

Em módulos DDD com entidades que têm `activate()`/`deactivate()` (`Admin`, `Client`), há rotas dedicadas:

```84:108:src/app/admin/infra/drivers/http/admin/admin-admin.controller.ts
  @Patch(':id/activate')
  @RequiredClaims(Claim.ADMIN_WRITE)
  @Swagger({
    tags: ['Administradores'],
    summary: 'Ativar administrador',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public activate(@Param() params: Params): Promise<SuccessMessage> {
    return this.activateAdmin.execute(params.id);
  }

  @Patch(':id/deactivate')
  @RequiredClaims(Claim.ADMIN_WRITE)
  @Swagger({
    tags: ['Administradores'],
    summary: 'Inativar administrador',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public deactivate(@Param() params: Params): Promise<SuccessMessage> {
    return this.deactivateAdmin.execute(params.id);
  }
```

### 9) Decoradores @Body, @Query, @Param

| Origem | Decorator | DTO base sugerido |
|---|---|---|
| Body JSON | `@Body() body: <Verbo><X>InputDto` | `<Verbo><X>InputDto` |
| Query string | `@Query() queries: FindAll<X>QueryDto` | `extends Queries` |
| Path param genérico | `@Param() params: Params` | `Params` |
| Path param + clientId | `@Param() params: ParamsClientId` | `ParamsClientId` |

### 10) Tags Swagger

Use **nomes em português** que façam sentido na UI do Swagger. Exemplos detectados: `'FAQs'`, `'Administradores'`, `'FAQs - Público'`. Para sub-recursos, use prefixo: `'Cliente / Anexos'`, `'Cliente / Endereços'`.

### 11) Bootstrap e setup do Swagger

Já está configurado em `main.ts` — disponível em `/swagger`:

```24:32:src/main.ts
  const config = new DocumentBuilder()
    .setTitle('DPASIS REST API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config, { autoTagControllers: false });
  SwaggerModule.setup('swagger', app, document);
```

`autoTagControllers: false` ⇒ as tags vêm exclusivamente do `@Swagger({ tags: [...] })`. Não use `@ApiTags` no nível da classe.

## Convenções Obrigatórias

- Controllers ficam em **`infra/drivers/http/<canal>/<modulo>-<canal>.controller.ts`**
- Path do `@Controller` = `'<canal>/<modulo>'` (ex.: `'admin/faq'`, `'user/faq'`)
- Método retornar `Promise<...>` — o uso de `async` é opcional (alguns retornam `this.useCase.execute(...)` direto sem `async`)
- Nomes canônicos dos métodos: `create`, `findAll`, `findOne`, `update`, `updateStatus`, `activate`, `deactivate`, `remove`
- TODA rota tem `@Swagger({...})`. Sem exceção
- TODA rota administrativa tem `@RequiredClaims(...)`
- TODA rota administrativa tem `@RequiredRoles(...)` no controller (nível classe)
- DTOs de body/query/param são os mesmos do use case (não criar variantes só para o controller)
- Rotas mais específicas declaradas **antes** das genéricas (`:id/status` antes de `:id`)

## Anti-Padrões (Nunca Faça)

- ❌ Lógica de negócio no controller. Controller só chama `useCase.execute(...)`
- ❌ `@ApiTags` ou `@ApiOperation` direto. Use sempre `@Swagger({ tags, summary, ... })`
- ❌ Esquecer `@Swagger`. Quebra documentação OpenAPI e formatação dos errors
- ❌ Path com plural (`'/faqs'`). Use **singular** (`'admin/faq'`) — convenção do projeto
- ❌ Mesclar admin e user no mesmo controller. Sempre separe arquivos
- ❌ `@HttpCode(204)` em endpoints. O projeto retorna sempre `SuccessMessage` ou DTO
- ❌ Criar DTOs específicos do controller. Reuse os do use case (`Create<X>InputDto`, `Edit<X>InputDto`)
- ❌ Ordem errada de rotas (`:id` antes de `:id/status`)

## Exemplo Completo

Controller admin completo do FAQ (referência canônica):

```21:108:src/app/faq/infra/drivers/http/admin/faq-admin.controller.ts
@Controller('admin/faq')
@RequiredRoles(AccountRole.ADMIN)
export class FaqAdminController {
  constructor(
    private readonly createFaq: CreateFaq,
    private readonly findAllFaq: FindAllFaq,
    private readonly findFaqById: FindFaqById,
    private readonly editFaq: EditFaq,
    private readonly updateFaqStatus: UpdateFaqStatus,
    private readonly deleteFaq: DeleteFaq,
  ) {}

  @Post()
  @RequiredClaims(Claim.FAQ_WRITE)
  @Swagger({ tags: ['FAQs'], summary: 'Criar nova FAQ', applyBadRequest: true, createdResponse: CreateFaqOutputDto })
  public create(@Body() body: CreateFaqInputDto): Promise<CreateFaqOutputDto> {
    return this.createFaq.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.FAQ_READ)
  @Swagger({ tags: ['FAQs'], summary: 'Listar FAQs com paginação e busca', applyBadRequest: true, okPaginatedResponse: FaqDto })
  public findAll(@Query() queries: FindAllFaqQueryDto): Promise<IPagination<FaqDto>> {
    return this.findAllFaq.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.FAQ_READ)
  @Swagger({ tags: ['FAQs'], summary: 'Buscar FAQ por ID', applyBadRequest: true, applyNotFound: true, okResponse: FaqDto })
  public findOne(@Param() params: Params): Promise<FaqDto> {
    return this.findFaqById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.FAQ_WRITE)
  @Swagger({ tags: ['FAQs'], summary: 'Inverter status ativo da FAQ', applyBadRequest: true, applyNotFound: true, okResponse: SuccessMessage })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateFaqStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.FAQ_WRITE)
  @Swagger({ tags: ['FAQs'], summary: 'Editar FAQ', applyBadRequest: true, applyNotFound: true, okResponse: SuccessMessage })
  public update(@Param() params: Params, @Body() body: EditFaqInputDto): Promise<SuccessMessage> {
    return this.editFaq.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.FAQ_WRITE)
  @Swagger({ tags: ['FAQs'], summary: 'Deletar FAQ', applyBadRequest: true, applyNotFound: true, okResponse: SuccessMessage })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteFaq.execute(params.id);
  }
}
```
