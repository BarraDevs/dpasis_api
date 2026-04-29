---
name: upload-file-flow
description: >-
  Fluxo de upload de arquivos do projeto: gateway `IUploadFileGateway` (S3 real
  + Fake), use cases `UploadSingle`/`UploadArray` com validação de tamanho/MIME,
  recepção de `multipart/form-data` em controllers (FileInterceptor +
  ApiConsumes + UploadedFile + mergeRequestBody com `UploadSingleInputDto`),
  organização de pastas via Value Object `<X>Folder`, e exclusão assíncrona
  via `IUploadFileQueueProducer.addDeleteJob`. Use SEMPRE que precisar receber
  arquivo num endpoint, fazer upload pra S3, validar imagem, deletar arquivo,
  ou quando o usuário disser "upload de arquivo", "multipart", "formData",
  "FileInterceptor", "UploadedFile", "S3", "imagem", "anexo", "upload",
  "multipart/form-data", "Express.Multer.File", "deletar arquivo", "URL
  pública", "pasta no bucket", "folder do upload".
---

# Fluxo de Upload de Arquivos (`upload-file`)

## Contexto

O projeto tem **uma única infra de upload de arquivos** com dois consumidores no app: o use case `UploadSingle` (1 arquivo) e o use case `UploadArray` (vários arquivos). A persistência efetiva é feita pelo **Gateway `IUploadFileGateway`**, que tem dois adapters:

- `UploadS3AdapterGateway` (real, AWS S3 com `@aws-sdk/client-s3` + `@aws-sdk/lib-storage`)
- `UploadFakeAdapterGateway` (testes, devolve `'http://fake-url.com/<timestamp>'`)

A escolha real/fake é feita por `UploadFileModule.register()` em `src/infra/upload-file/upload-file.module.ts` baseado em `NODE_ENV === 'test'`. **Não use o gateway diretamente em use cases** — sempre passe pelos use cases `UploadSingle`/`UploadArray`, que aplicam as validações canônicas (tamanho ≤ 20MB, MIME `image/jpeg|png|webp|jpg` + `application/octet-stream` para iOS).

A exclusão de arquivo do S3 é **fire-and-forget via fila BullMQ**: use cases nunca chamam `gateway.delete()`; eles chamam `IUploadFileQueueProducer.addDeleteJob({ fileUrl })`, e o `UploadFileBullmqConsumer` é quem efetivamente apaga (assim a request HTTP retorna rápido e o erro de S3 não derruba o caso de uso).

Para o fluxo geral de filas (`QueueModule`, `BullModule.registerQueue`, fail-closed em test), veja a skill **`queue-bullmq`** — a parte específica de upload-file já está toda registrada no `UploadFileQueueModule`.

## Estrutura e Localização

```
src/infra/upload-file/                                    # Infra do gateway
├── upload-file.gateway.ts                                # Interface IUploadFileGateway
├── upload-file.module.ts                                 # UploadFileModule.register() (escolhe real/fake)
└── adapters/
    ├── aws-s3/
    │   ├── upload-s3.gateway.ts                          # Real (S3)
    │   └── upload-s3.gateway.spec.ts
    └── fake/
        └── upload-fake.gateway.ts                        # Fake (testes)

src/app/upload-file/                                      # App layer
├── application/
│   ├── usecases/
│   │   ├── upload-single/
│   │   │   ├── upload-single.service.ts                  # ⭐ UploadSingle (use este)
│   │   │   ├── upload-single.service.spec.ts
│   │   │   └── dtos/upload-single.dto.ts                 # UploadSingleInputDto / UploadSingleOutputDto
│   │   └── upload-array/
│   │       ├── upload-array.service.ts                   # UploadArray
│   │       ├── upload-array.service.spec.ts
│   │       └── dtos/upload-array.dto.ts
│   └── queue/
│       ├── upload-file-queue.module.ts                   # UploadFileQueueModule.register()
│       ├── upload-file-queue-producer.interface.ts       # IUploadFileQueueProducer
│       └── jobs/
│           ├── upload-file-job.dto.ts
│           └── delete-file-job.dto.ts
├── domain/errors/
│   ├── required-file.error.ts                            # 422 — arquivo obrigatório
│   ├── file-too-big.error.ts                             # 400 — > 20MB
│   └── invalid-file.error.ts                             # 400 — MIME não suportado
├── infra/
│   ├── driven/queue/
│   │   ├── bullmq/upload-file-queue-bullmq.producer.ts
│   │   └── fake/upload-file-queue-fake.producer.ts
│   └── drivers/queue/
│       └── bullmq/upload-file-bullmq.consumer.ts         # Apaga/upload do S3 em background
└── upload-file.module.ts                                 # Registra UploadSingle/UploadArray (já no AppModule)
```

`UploadFileModule` (do app) **já está importado em `src/app.module.ts`** — basta importá-lo no módulo da feature que vai usar `UploadSingle`/`UploadArray`/`IUploadFileQueueProducer`.

## Como Fazer

### 1) Importar `UploadFileModule` no módulo da feature

No `<feature>.module.ts`:

```typescript
import { UploadFileModule } from 'src/app/upload-file/upload-file.module';

@Module({
  imports: [
    UploadFileModule,
    // ...
  ],
})
export class FeatureModule {}
```

Isso disponibiliza `UploadSingle`, `UploadArray` e `TOKENS.UploadFileQueueProducer`. **Não importe `UploadFileModule` da pasta `src/infra/upload-file/`** — o app sempre passa pelo wrapper `src/app/upload-file/upload-file.module.ts`.

### 2) Receber `multipart/form-data` no controller (1 arquivo + body)

Padrão canônico para `POST` com arquivo opcional + campos JSON:

```47:63:src/app/client/client-type/client-system-type/infra/drivers/http/admin/client-system-type-admin.controller.ts
  @Post()
  @RequiredClaims(Claim.CLIENT_SYSTEM_TYPE_WRITE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de sistema'],
    summary: 'Criar novo tipo de sistema de cliente',
    applyBadRequest: true,
    mergeRequestBody: [CreateClientSystemTypeInputDto, UploadSingleInputDto],
    createdResponse: CreateClientSystemTypeOutputDto,
  })
  public create(
    @Body() body: CreateClientSystemTypeInputDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CreateClientSystemTypeOutputDto> {
    return this.createClientSystemType.execute(body, file);
  }
```

Pontos obrigatórios:

- **`@ApiConsumes('multipart/form-data')`** — declara ao Swagger que é form-data (sem isso, o Postman/UI não envia como multipart).
- **`@UseInterceptors(FileInterceptor('file'))`** — o argumento string (`'file'`) **TEM que bater com o nome do campo no DTO** `UploadSingleInputDto.file`. Não use outro nome (`image`, `attachment`, etc.) — sempre `file`.
- **`@UploadedFile() file?: Express.Multer.File`** — tipo padrão do Multer. Marque opcional (`?`) só quando o use case aceita ausência (ex.: edit, ou create com `link/imageUrl` alternativo).
- **`mergeRequestBody: [<MeuInputDto>, UploadSingleInputDto]`** — o Swagger custom faz `allOf` dos dois schemas, gerando 1 corpo único com todos os campos + `file` binary. **Sempre inclua `UploadSingleInputDto`**, ele já tem `@ApiPropertyOptional({ type: 'string', format: 'binary' })` no campo `file`.

`PATCH` segue o mesmo padrão; só troca `createdResponse` por `okResponse: SuccessMessage`:

```103:121:src/app/client/client-type/client-system-type/infra/drivers/http/admin/client-system-type-admin.controller.ts
  @Patch(':id')
  @RequiredClaims(Claim.CLIENT_SYSTEM_TYPE_WRITE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @Swagger({
    tags: ['Clientes - Tipos de cliente - Tipos de sistema'],
    summary: 'Editar tipo de sistema de cliente',
    applyBadRequest: true,
    applyNotFound: true,
    mergeRequestBody: [EditClientSystemTypeInputDto, UploadSingleInputDto],
    okResponse: SuccessMessage,
  })
  public update(
    @Param() params: Params,
    @Body() body: EditClientSystemTypeInputDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SuccessMessage> {
    return this.editClientSystemType.execute(params.id, body, file);
  }
```

### 3) DTO do `@Body()` em rotas multipart

Os DTOs `CreateXInputDto`/`EditXInputDto` **não mudam por causa do multipart**, mas qualquer campo numérico/booleano precisa de transformer (form-data sempre chega como string):

```5:13:src/app/client/client-attachment/application/usecases/create-client-attachment/dtos/create-client-attachment.dto.ts
export class CreateClientAttachmentInputDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  @Trim()
  clientId: number;
```

⚠️ Sem `@StringToNumber()` (ou `@StringToBoolean()` para booleans) o `class-validator` recebe `'1'` em vez de `1` e o `@IsInt` falha. Veja a skill **`dto-and-validation`** para a lista completa de transformers.

### 4) Use case que recebe arquivo opcional

O use case orquestra: validação alternativa (URL já existente vs. arquivo novo) → upload → persiste a URL final:

```16:39:src/app/client/client-type/client-system-type/application/usecases/create-client-system-type/create-client-system-type.service.ts
  public async execute(data: CreateClientSystemTypeInputDto, file?: Express.Multer.File): Promise<CreateClientSystemTypeOutputDto> {
    const existing = await this.clientSystemTypeDao.findByName(data.name);
    if (existing) {
      throw new ClientSystemTypeAlreadyExistsError(data.name);
    }

    let imageUrl: string | null = null;

    if (data.imageUrl !== null && data.imageUrl !== undefined) {
      imageUrl = data.imageUrl;
    }
    else if (file) {
      const folder = new ClientSystemTypeImageFolder();
      const result = await this.uploadSingle.execute(file, folder.value);
      imageUrl = result.url;
    }

    const id = await this.clientSystemTypeDao.save({
      name: data.name,
      imageUrl,
    });

    return { id };
  }
```

E o use case quando o arquivo é **obrigatório** (sem alternativa):

```18:39:src/app/client/client-attachment/application/usecases/create-client-attachment/create-client-attachment.service.ts
  public async execute(data: CreateClientAttachmentInputDto, file: Express.Multer.File | undefined): Promise<CreateClientAttachmentOutputDto> {
    const client = await this.findClientById.execute(data.clientId, { onlyActive: true });

    let link: string;
    if (data.link !== null && data.link !== undefined) {
      link = data.link;
    }
    else {
      if (!file) throw new RequiredFileError();
      const folder = new ClientAttachmentFolder(client.id);
      const result = await this.uploadSingle.execute(file, folder.value);
      link = result.url;
    }

    const id = await this.clientAttachmentDao.save({
      clientId: client.id,
      description: data.description,
      link,
    });

    return { id };
  }
```

Regras importantes do use case:

- **Injete `UploadSingle` por classe** (sem `@Inject(TOKEN)` — não tem token; é um provider direto):
  ```typescript
  constructor(
    private readonly uploadSingle: UploadSingle,
  ) {}
  ```
- **Nunca injete `IUploadFileGateway` direto no use case** — quem valida MIME/tamanho é o `UploadSingle`. Bypassar significa duplicar regras e arriscar subir arquivo inválido.
- **A pasta vai num Value Object** (`<X>Folder` em `domain/value-objects/`) com a estrutura final tipo `'<recurso>/<id>/<sub>'`. Veja seção 6.
- **Se o DTO tem `link`/`imageUrl` opcional** (URL pré-existente na nuvem), trate-o **antes** do upload — economiza chamada ao S3 quando o front já tem a URL.

### 5) `UploadSingle` por baixo (referência de validações aplicadas)

```10:38:src/app/upload-file/application/usecases/upload-single/upload-single.service.ts
export class UploadSingle {
  private readonly TWENTY_MEGABYTES = 20 * 1024 * 1024;
  private readonly SUPPORTED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'application/octet-stream', // for ios files
  ];

  constructor(
    @Inject(TOKENS.UploadFileGateway) private readonly uploadFileGateway: IUploadFileGateway
  ) {}

  public async execute(file: Express.Multer.File, folder?: string): Promise<UploadSingleOutputDto> {
    if (!file) {
      throw new RequiredFileError();
    }
    if (file.size > this.TWENTY_MEGABYTES) {
      throw new FileTooBigError(this.TWENTY_MEGABYTES / 1024 / 1024);
    }
    if (!this.SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
      throw new InvalidFileError(this.SUPPORTED_MIME_TYPES);
    }

    const url = await this.uploadFileGateway.upload(file, folder);

    return { url };
  }
}
```

Erros que podem subir do `UploadSingle.execute()` (todos `AppException`, capturados pelo filter global):

| Erro | HTTP | Quando |
|---|---|---|
| `RequiredFileError` | 422 | `file` é `null`/`undefined` |
| `FileTooBigError` | 400 | `file.size > 20MB` |
| `InvalidFileError` | 400 | MIME fora de `image/jpeg|png|webp|jpg` ou `application/octet-stream` |
| `ExternalApiError` | (do gateway) | Falha do S3 (logs em `LogContext.UPLOAD_FILE`) |

⚠️ **Para alterar o limite de 20MB ou aceitar PDF/zip**, mude o `UploadSingle` (constants `TWENTY_MEGABYTES`/`SUPPORTED_MIME_TYPES`) — não duplique validação no controller nem ignore a lista no use case.

### 6) Folder Value Object (organização de pastas no S3)

Para cada agregado que faz upload, crie um **VO de pasta** em `domain/value-objects/<x>-folder.vo.ts`. A pasta vira **prefixo da Key no S3** (`<folder>/<uuid>-<originalname>`).

```1:11:src/app/client/client-attachment/domain/value-objects/client-attachment-folder.vo.ts
export class ClientAttachmentFolder {
  private readonly _value: string;

  constructor(clientId: number) {
    this._value = `clients/${clientId}/attachments`;
  }

  public get value(): string {
    return this._value;
  }
}
```

Convenções:

- **Nome da classe**: `<X>Folder` ou `<X>ImageFolder` quando há mais de 1 tipo de upload no mesmo agregado.
- **Plural snake/kebab no path**, hierarquia clara: `clients/<id>/attachments`, `client-system-types`, `resales/<id>/contracts`.
- O VO encapsula a regra de pasta — **não monte string crua no use case** (`'clients/' + id + '/attachments'`). Isso é VO; instancie e use `folder.value`.
- Veja a skill **`domain-modeling`** seção VOs para detalhes (`_instantiate`, `equals`, etc.).

### 7) Múltiplos arquivos (`UploadArray`)

Existe `UploadArray` para receber array, mas **não há controller no projeto usando ainda** — siga o mesmo padrão do `UploadSingle`, trocando:

| Single | Array |
|---|---|
| `FileInterceptor('file')` | `FilesInterceptor('files')` |
| `@UploadedFile()` | `@UploadedFiles()` |
| `Express.Multer.File` | `Array<Express.Multer.File>` |
| `UploadSingleInputDto` | `UploadArrayInputDto` (campo `files: File[]`) |
| `this.uploadSingle.execute(file, folder)` | `this.uploadArray.execute(files)` (sem folder atualmente) |

`UploadArray` chama `UploadSingle.execute()` em paralelo (`Promise.all`) — então cada arquivo herda automaticamente as validações de tamanho/MIME.

### 8) Excluir arquivo do S3 (sempre via fila)

Em `Edit` (quando troca o arquivo) e em `Delete` (quando apaga o registro), **enfileire o delete** — não apague síncrono:

```19:43:src/app/client/client-attachment/application/usecases/edit-client-attachment/edit-client-attachment.service.ts
  public async execute(id: number, data: EditClientAttachmentInputDto, file?: Express.Multer.File): Promise<SuccessMessage> {
    const attachment = await this.clientAttachmentDao.findById(id);
    if (!attachment) {
      throw new ClientAttachmentNotFoundError();
    }

    let newLink: string | undefined;

    if (data.link !== null && data.link !== undefined) {
      newLink = data.link;
    }
    else if (file) {
      const folder = new ClientAttachmentFolder(attachment.clientId);
      const result = await this.uploadSingle.execute(file, folder.value);
      newLink = result.url;
    }

    await this.clientAttachmentDao.edit(id, { ...data, link: newLink });

    if (newLink) {
      await this.uploadFileQueueProducer.addDeleteJob({ fileUrl: attachment.link });
    }

    return { message: 'Anexo do cliente atualizado com sucesso' };
  }
```

Injete o producer com token + interface (`type` import):

```typescript
@Inject(TOKENS.UploadFileQueueProducer) private readonly uploadFileQueueProducer: IUploadFileQueueProducer,
```

⚠️ **Antes de enfileirar o delete em `Delete<X>`**, verifique se a URL **não é compartilhada** por outro registro (FK pra mesma URL): se for, lance `<X>LinkSharedError`/`<X>ImageUrlSharedError` em vez de apagar (do contrário, derruba o arquivo de quem ainda referencia). Veja `DeleteClientAttachment` (`findByLinkExcludingId`) e `DeleteClientSystemType` (`findByImageUrlExcludingId`) como referência canônica.

### 9) Testes

- **Unit do use case** (`*.service.spec.ts`): mocke `UploadSingle.execute` retornando `{ url: '...' }` (ou faça `createMock<UploadSingle>()`). Não faça upload real.
- **Unit do controller** (`*.controller.spec.ts`): passe um `createMock<Express.Multer.File>({ size, mimetype, originalname, buffer })` e verifique que o use case foi chamado com o file.
- **Integration**: o `UploadFileModule.register()` em `NODE_ENV=test` já provê `UploadFakeAdapterGateway` e `UploadFileQueueFakeAdapterProducer` — ou seja, integração não toca S3 nem Redis. O fake guarda jobs em arrays públicos (`addedUploadJobs`/`addedDeleteJobs`) que dá pra inspecionar.
- Para a estratégia geral (mocks vs. banco real, `createMock`, `PrismaService.truncate`), veja **`testing-strategy`**.

## Convenções Obrigatórias

- Use cases **sempre** chamam `UploadSingle`/`UploadArray`, **nunca** `IUploadFileGateway` direto.
- Nome do campo de form-data é **sempre `file`** (single) ou **`files`** (array). Bate com o `FileInterceptor`/DTO.
- Toda rota multipart tem **`@ApiConsumes('multipart/form-data')` + `@UseInterceptors(FileInterceptor('file'))` + `mergeRequestBody: [<InputDto>, UploadSingleInputDto]`**. Os 3 sempre juntos.
- Pasta no S3 vai em **Value Object `<X>Folder`** em `domain/value-objects/`, instanciado no use case.
- Exclusão **sempre via fila** (`uploadFileQueueProducer.addDeleteJob({ fileUrl })`), **depois** de persistir/deletar o registro.
- Em `Delete`/`Edit`, **valide compartilhamento da URL** antes de enfileirar o delete (evita apagar arquivo referenciado por outro registro).
- Quando o DTO aceita **URL alternativa** (`link`/`imageUrl`), trate-a antes de chamar `UploadSingle` — economiza S3 quando já vem URL pronta do front.
- Importe `UploadFileModule` do app (`src/app/upload-file/upload-file.module.ts`), **não** do infra (`src/infra/upload-file/upload-file.module.ts`).
- Campos numéricos/booleanos de `@Body` em rota multipart precisam de `@StringToNumber()`/`@StringToBoolean()` — form-data chega como string.

## Anti-Padrões (Nunca Faça)

- ❌ Injetar `IUploadFileGateway` direto no use case e bypassar `UploadSingle`. Perde validação de tamanho/MIME.
- ❌ `await this.uploadFileGateway.delete(url)` síncrono no use case. Sempre `addDeleteJob`.
- ❌ Mudar o nome do campo `file` para `image`/`avatar`/`attachment` no DTO ou no `FileInterceptor`. Quebra o `mergeRequestBody` (o `UploadSingleInputDto` é canônico) e a UI do Swagger.
- ❌ Esquecer `@ApiConsumes('multipart/form-data')`. O Swagger UI envia como `application/json` e o file chega `undefined`.
- ❌ Esquecer `mergeRequestBody: [..., UploadSingleInputDto]`. O campo `file` some do contract OpenAPI; cliente não envia o arquivo.
- ❌ Aplicar `@StringToNumber()` no campo `file` (ou aplicar `@IsString` nele). Não é string, é binário.
- ❌ Validar tamanho/MIME no controller (`if (file.size > X) throw new BadRequestException(...)`). Isso é responsabilidade do `UploadSingle`.
- ❌ Apagar arquivo no `Delete<X>` sem checar `findByLinkExcludingId` / `findByImageUrlExcludingId`. Pode quebrar referências de outro registro.
- ❌ Montar pasta como string crua no use case (`` `clients/${id}/attachments` ``). Use VO `<X>Folder`.
- ❌ Usar `@Inject(TOKENS.UploadSingle)` — `UploadSingle` é provider direto sem token, injete pela classe.
- ❌ Importar `UploadFileModule` do `src/infra/upload-file/`. Sempre o do `src/app/upload-file/`.

## Exemplo Completo (referência canônica)

`ClientSystemType` é o exemplo mais completo: tem rota POST e PATCH com upload opcional + URL alternativa, VO de pasta, e Delete que valida URL compartilhada antes de enfileirar exclusão.

- Controller: `src/app/client/client-type/client-system-type/infra/drivers/http/admin/client-system-type-admin.controller.ts`
- Use case Create: `src/app/client/client-type/client-system-type/application/usecases/create-client-system-type/create-client-system-type.service.ts`
- Use case Edit: `src/app/client/client-type/client-system-type/application/usecases/edit-client-system-type/edit-client-system-type.service.ts`
- Use case Delete: `src/app/client/client-type/client-system-type/application/usecases/delete-client-system-type/delete-client-system-type.service.ts`
- VO de pasta: `src/app/client/client-type/client-system-type/domain/value-objects/client-system-type-image-folder.vo.ts`

Para arquivo **obrigatório** (sem URL alternativa em todos os fluxos), veja `ClientAttachment` (especialmente `CreateClientAttachment` que faz `if (!file) throw new RequiredFileError()`).
