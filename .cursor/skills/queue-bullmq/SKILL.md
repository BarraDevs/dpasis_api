---
name: queue-bullmq
description: >-
  Padrão de filas assíncronas do projeto com BullMQ + Redis. Cobre a infra
  global (`QueueModule.register()`), o registro de fila por feature
  (`BullModule.registerQueue` dentro de um `<X>QueueModule`), o producer
  via interface + adapter real (BullMQ) + adapter fake (testes), o
  consumer com `@Processor` + `WorkerHost`, jobs DTO em
  `application/queue/jobs/`, enums `QueueName`/`JobName` e fail-closed em
  `NODE_ENV=test`. Use SEMPRE que precisar enfileirar jobs, processar
  jobs em background, integrar BullMQ num módulo, criar producer/consumer
  novo, ou quando o usuário disser "fila", "queue", "BullMQ", "job",
  "worker", "producer", "consumer", "background job", "processar
  assíncrono", "Redis fila", "addJob", "@Processor", "WorkerHost",
  "InjectQueue", "registerQueue".
---

# Filas com BullMQ

## Contexto

Filas assíncronas no projeto rodam em **BullMQ 11** sobre **Redis**. O setup é organizado em três níveis:

1. **Infra global** — `src/infra/queue/queue.module.ts` (`@Global`) instala o `BullModule.forRootAsync` com a connection do Redis derivada de `ConfigService.redisUrl` no DB `redisQueueDatabase` (`= 1`). Em `NODE_ENV=test`, **não registra nada** (o `BullModule` real fica fora do grafo).
2. **Enums centralizados** — `QueueName` e `JobName` ficam em `src/infra/queue/enums/`. Toda fila/job nova entra aqui.
3. **Por feature** — cada agregado que produz/consome jobs tem um sub-módulo `<feature>-queue.module.ts` em `application/queue/` que:
   - registra a fila com `BullModule.registerQueue({ name, defaultJobOptions })` em runtime real
   - declara o **port** (`I<X>QueueProducer`) + **adapter real BullMQ** + **adapter fake** + **consumer**
   - é importado por outros módulos que querem enfileirar jobs

⚠️ **Domínio nunca conhece BullMQ**. A lib `bullmq` e os decorators `@nestjs/bullmq` (`@InjectQueue`, `@Processor`, `WorkerHost`) **só aparecem em `infra/driven/queue/bullmq/` e `infra/drivers/queue/bullmq/`**. O resto do código depende apenas da interface `I<X>QueueProducer` e dos DTOs de job.

Fila de referência (única hoje no projeto): `upload-file`. Estude `src/app/upload-file/` antes de adicionar uma nova fila.

## Estrutura e Localização

```
src/infra/queue/
├── queue.module.ts                         # @Global, BullModule.forRootAsync (connection Redis)
└── enums/
    ├── queue-name.enum.ts                  # enum QueueName { ... }
    └── job-name.enum.ts                    # enum JobName { ... }

src/app/<feature>/
├── application/queue/
│   ├── <feature>-queue.module.ts           # registerQueue + binding fake/real + consumer
│   ├── <feature>-queue-producer.interface.ts   # interface I<Feature>QueueProducer
│   └── jobs/
│       ├── <verbo>-<recurso>-job.dto.ts    # payload do job (class shape)
│       └── ...
└── infra/
    ├── driven/queue/
    │   ├── bullmq/
    │   │   ├── <feature>-queue-bullmq.producer.ts
    │   │   └── <feature>-queue-bullmq.producer.spec.ts
    │   └── fake/
    │       └── <feature>-queue-fake.producer.ts
    └── drivers/queue/
        └── bullmq/
            ├── <feature>-bullmq.consumer.ts
            └── <feature>-bullmq.consumer.spec.ts
```

Mapeamento de camadas (mantém a hexagonal):

| Camada | Artefato | Pasta |
|---|---|---|
| Application (port) | `I<Feature>QueueProducer` (interface) | `application/queue/` |
| Application (DTO) | `<Verbo><Recurso>JobDto` | `application/queue/jobs/` |
| Application (módulo) | `<Feature>QueueModule` | `application/queue/` |
| Driven (saída) | Producer BullMQ + fake | `infra/driven/queue/{bullmq,fake}/` |
| Drivers (entrada) | Consumer (`@Processor`) | `infra/drivers/queue/bullmq/` |

> O **consumer** é considerado "driver" porque é um **canal de entrada** — é a fila quem chama o app, igual ao HTTP. Por isso fica em `infra/drivers/`. O **producer** é "driven" — o app empurra para fora.

## Como Fazer

### 1) Registrar `QueueName` e `JobName`

Em `src/infra/queue/enums/queue-name.enum.ts`:

```typescript
export enum QueueName {
  UploadFile = 'upload-file',
  // adicione novos aqui — valor em kebab-case
}
```

Em `src/infra/queue/enums/job-name.enum.ts`:

```typescript
export enum JobName {
  UploadFile = 'upload-file',
  DeleteFile = 'delete-file',
  // um valor por TIPO de job que pode ser despachado
}
```

Convenção:
- `QueueName.<NomeDaFeatureEmPascal>` com valor em `kebab-case`
- `JobName.<VerboRecursoEmPascal>` com valor em `kebab-case` (`'upload-file'`, `'send-email'`)
- Uma fila pode receber **múltiplos `JobName`** distintos (o consumer faz `switch` em `job.name`)

### 2) Registrar o token do producer

Em `src/core/di/token.ts`, adicione:

```typescript
const TOKENS = {
  // ...
  UploadFileQueueProducer: Symbol.for('UploadFileQueueProducer'),
  // padrão: <Feature>QueueProducer
};
```

Veja `.cursor/skills/dependency-injection/SKILL.md` e `.cursor/skills/naming-conventions/SKILL.md` (linha "Producer de fila").

### 3) DTO(s) do job

Em `src/app/<feature>/application/queue/jobs/<verbo>-<recurso>-job.dto.ts`:

```1:7:src/app/upload-file/application/queue/jobs/upload-file-job.dto.ts
export class UploadFileJobDto {
  originalName: string;
  mimetype: string;
  size: number;
  bufferBase64: string;
  folder?: string;
}
```

Regras:
- **Classe TypeScript pura** — sem `class-validator`, sem `@ApiProperty` (job não vai pela rede HTTP)
- Apenas tipos **serializáveis em JSON** (`string`, `number`, `boolean`, arrays, objetos planos). `Buffer` vira `base64`; `Date` vira ISO string.
- Não passe entidades de domínio nem instâncias de classes — são serializadas pelo Redis e perdem comportamento. Achate em primitivos.
- Nomeie como `<Verbo><Recurso>JobDto` (PascalCase).
- Um arquivo por job; se a fila tem N tipos, terá N DTOs.

### 4) Interface do producer (port)

Em `src/app/<feature>/application/queue/<feature>-queue-producer.interface.ts`:

```1:7:src/app/upload-file/application/queue/upload-file-queue-producer.interface.ts
import type { DeleteFileJobDto } from './jobs/delete-file-job.dto';
import type { UploadFileJobDto } from './jobs/upload-file-job.dto';

export interface IUploadFileQueueProducer {
  addUploadJob(data: UploadFileJobDto): Promise<void>;
  addDeleteJob(data: DeleteFileJobDto): Promise<void>;
}
```

Regras:
- Nome **`I<Feature>QueueProducer`**
- Um método **`add<Verbo><Recurso>Job(data: <X>JobDto): Promise<void>`** por tipo de job
- Sem `import` de `bullmq`. Só DTOs e tipos próprios.
- Use `import type` (consistente com o resto dos ports do projeto)

### 5) Adapter real (BullMQ)

Em `src/app/<feature>/infra/driven/queue/bullmq/<feature>-queue-bullmq.producer.ts`:

```1:23:src/app/upload-file/infra/driven/queue/bullmq/upload-file-queue-bullmq.producer.ts
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import type { DeleteFileJobDto } from '../../../../application/queue/jobs/delete-file-job.dto';
import type { UploadFileJobDto } from '../../../../application/queue/jobs/upload-file-job.dto';
import type { IUploadFileQueueProducer } from '../../../../application/queue/upload-file-queue-producer.interface';

@Injectable()
export class UploadFileQueueBullmqAdapterProducer implements IUploadFileQueueProducer {
  constructor(
    @InjectQueue(QueueName.UploadFile) private readonly queue: Queue,
  ) {}

  public async addUploadJob(data: UploadFileJobDto): Promise<void> {
    await this.queue.add(JobName.UploadFile, data);
  }

  public async addDeleteJob(data: DeleteFileJobDto): Promise<void> {
    await this.queue.add(JobName.DeleteFile, data);
  }
}
```

Regras:
- Nome **`<Feature>QueueBullmqAdapterProducer`** (espelha o padrão `<Tecnologia>AdapterGateway`/`<Tecnologia>AdapterProducer`)
- `@InjectQueue(QueueName.<X>)` para receber a `Queue` injetada pelo `BullModule`
- Cada método chama **`this.queue.add(JobName.<X>, data)`**
- **NÃO** capture/transforme erros — deixe o erro do BullMQ propagar; o use case decide se trata. (Diferente dos gateways HTTP, que mapeiam para `ExternalApiError`.)
- Não importe `Inject(TOKENS...)`; só `@InjectQueue` e o que vier de `application/queue/`

### 6) Adapter fake (testes)

Em `src/app/<feature>/infra/driven/queue/fake/<feature>-queue-fake.producer.ts`:

```1:19:src/app/upload-file/infra/driven/queue/fake/upload-file-queue-fake.producer.ts
import { Injectable } from '@nestjs/common';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import type { DeleteFileJobDto } from '../../../../application/queue/jobs/delete-file-job.dto';
import type { UploadFileJobDto } from '../../../../application/queue/jobs/upload-file-job.dto';
import type { IUploadFileQueueProducer } from '../../../../application/queue/upload-file-queue-producer.interface';

@Injectable()
export class UploadFileQueueFakeAdapterProducer implements IUploadFileQueueProducer {
  public readonly addedUploadJobs: Array<{ name: JobName; data: UploadFileJobDto }> = [];
  public readonly addedDeleteJobs: Array<{ name: JobName; data: DeleteFileJobDto }> = [];

  public async addUploadJob(data: UploadFileJobDto): Promise<void> {
    this.addedUploadJobs.push({ name: JobName.UploadFile, data });
  }

  public async addDeleteJob(data: DeleteFileJobDto): Promise<void> {
    this.addedDeleteJobs.push({ name: JobName.DeleteFile, data });
  }
}
```

Regras:
- Nome **`<Feature>QueueFakeAdapterProducer`**
- Implementa a mesma interface
- **Não faz I/O**: empurra para um array `public readonly addedXxxJobs` (nome plural, descritivo). Esse array é o que os testes inspecionam.
- Um array por método/`JobName` (mantém a separação clara em `expect`)
- Zero dependências de `bullmq` — fica leve e instala em qualquer test bed

### 7) Consumer (worker)

Em `src/app/<feature>/infra/drivers/queue/bullmq/<feature>-bullmq.consumer.ts`:

```29:52:src/app/upload-file/infra/drivers/queue/bullmq/upload-file-bullmq.consumer.ts
@Processor(QueueName.UploadFile)
@Injectable()
export class UploadFileBullmqConsumer extends WorkerHost {
  constructor(
    @Inject(TOKENS.UploadFileGateway) private readonly uploadFileGateway: IUploadFileGateway,
  ) {
    super();
  }

  public async process(job: Job<UploadFileJobDto | DeleteFileJobDto>): Promise<void> {
    switch (job.name) {
      case JobName.UploadFile: {
        const payload = job.data as UploadFileJobDto;
        await this.uploadFileGateway.upload(createMulterFileFromUploadJobDto(payload), payload.folder);
        return;
      }
      case JobName.DeleteFile:
        await this.uploadFileGateway.delete((job.data as DeleteFileJobDto).fileUrl);
        return;
      default:
        throw new AppException(`Unknown job name: ${job.name}`);
    }
  }
}
```

Regras:
- Nome **`<Feature>BullmqConsumer`**
- Decoradores: **`@Processor(QueueName.<X>)`** + `@Injectable()`
- **Estende `WorkerHost`** e implementa `process(job: Job<...>): Promise<void>`
- Se a fila aceita múltiplos `JobName`, faça `switch (job.name)` retornando em cada caso e `default: throw new AppException(\`Unknown job name: ${job.name}\`)`
- Tipagem do payload: **`Job<JobDtoA | JobDtoB | ...>`**; faça `as <X>JobDto` dentro do `case` correspondente
- Não importe `bullmq` direto — `Job` e `WorkerHost` vêm de `@nestjs/bullmq` e `bullmq`, respectivamente
- O consumer **chama gateways e use cases** (via `@Inject(TOKENS.*)`); ele NÃO acessa Prisma direto e NÃO acessa controllers
- Erros lançados aqui propagam para o BullMQ e disparam retry conforme `defaultJobOptions` (ver passo 8)
- O consumer **só é registrado em produção** — em `NODE_ENV=test` ele fica fora do grafo (ver passo 8). Os testes mockam o producer/fake, não o consumer.

#### Helpers de payload

Se o consumer precisa "rehidratar" o payload (ex.: converter `bufferBase64` → `Express.Multer.File`), defina uma **função pura** no topo do arquivo, **fora da classe**, como em:

```13:27:src/app/upload-file/infra/drivers/queue/bullmq/upload-file-bullmq.consumer.ts
function createMulterFileFromUploadJobDto(dto: UploadFileJobDto): Express.Multer.File {
  const buffer = Buffer.from(dto.bufferBase64, 'base64');
  return {
    fieldname: 'file',
    originalname: dto.originalName,
    encoding: '7bit',
    mimetype: dto.mimetype,
    size: dto.size,
    buffer,
    destination: '',
    filename: '',
    path: '',
    stream: Readable.from(buffer),
  };
}
```

### 8) Module da feature (`<Feature>QueueModule`)

Em `src/app/<feature>/application/queue/<feature>-queue.module.ts`:

```1:42:src/app/upload-file/application/queue/upload-file-queue.module.ts
import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import { UploadFileModule as UploadFileInfraModule } from 'src/infra/upload-file/upload-file.module';
import { UploadFileQueueBullmqAdapterProducer } from '../../infra/driven/queue/bullmq/upload-file-queue-bullmq.producer';
import { UploadFileQueueFakeAdapterProducer } from '../../infra/driven/queue/fake/upload-file-queue-fake.producer';
import { UploadFileBullmqConsumer } from '../../infra/drivers/queue/bullmq/upload-file-bullmq.consumer';

@Module({})
export class UploadFileQueueModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: UploadFileQueueModule,
      imports: [
        ...(isTest ? [] : [
          BullModule.registerQueue({
            name: QueueName.UploadFile,
            defaultJobOptions: {
              removeOnComplete: true,
              removeOnFail: true,
            },
          }),
        ]),
        UploadFileInfraModule.register(),
      ],
      providers: [
        {
          provide: TOKENS.UploadFileQueueProducer,
          useClass: isTest ? UploadFileQueueFakeAdapterProducer : UploadFileQueueBullmqAdapterProducer,
        },
        ...(isTest ? [] : [UploadFileBullmqConsumer]),
      ],
      exports: [
        TOKENS.UploadFileQueueProducer,
      ],
    };
  }
}
```

Regras (na ordem):
- `@Module({})` vazio + `static register(): DynamicModule` (mesma forma dos gateways)
- Compute `isTest = process.env.NODE_ENV === Environment.Test` no topo
- **Em produção** (`!isTest`):
  - Importa `BullModule.registerQueue({ name, defaultJobOptions: { removeOnComplete: true, removeOnFail: true } })`
  - Registra **o consumer como provider** (`UploadFileBullmqConsumer`)
- **Em testes** (`isTest`):
  - **NÃO** importa `BullModule.registerQueue` (senão tenta abrir conexão com Redis)
  - **NÃO** registra o consumer
- O **provider do producer** é o único que existe nos dois mundos, com `useClass: isTest ? Fake : Bullmq`
- `exports: [TOKENS.<Feature>QueueProducer]` — só o port sai; consumer não precisa ser exportado
- Importa também os gateways/módulos infra que o consumer/producer dependem (ex.: `UploadFileInfraModule.register()` para o gateway de S3)
- **NÃO** use `@Global()` aqui — esse módulo é importado por feature

### 9) `defaultJobOptions` recomendados

`removeOnComplete: true` e `removeOnFail: true` evitam acumular jobs no Redis. Para retries em jobs flaky:

```typescript
defaultJobOptions: {
  removeOnComplete: true,
  removeOnFail: true,
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
}
```

Decisão registrada: hoje o projeto usa apenas `removeOnComplete + removeOnFail`. Adicione `attempts/backoff` somente se a operação for **idempotente**; caso contrário, faça idempotência explícita no consumer.

### 10) Consumir o producer num use case

Trate igual a qualquer port — `@Inject(TOKENS.<Feature>QueueProducer)` + `import type`:

```10:18:src/app/client/client-attachment/application/usecases/delete-client-attachment/delete-client-attachment.service.ts
@Injectable()
export class DeleteClientAttachment {
  constructor(
    @Inject(TOKENS.ClientAttachmentDao) private readonly clientAttachmentDao: IClientAttachmentDao,
    @Inject(TOKENS.UploadFileQueueProducer) private readonly uploadFileQueueProducer: IUploadFileQueueProducer,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    // ...
```

E no `<modulo>.module.ts` da feature consumidora, importe o `<Feature>QueueModule.register()`:

```15:22:src/app/client/client-attachment/client-attachment.module.ts
@Module({
  imports: [
    ClientAttachmentPersistenceModule,
    ClientModule,
    AuthenticationGuardsModule,
    UploadFileModule,
    UploadFileQueueModule.register(),
  ],
```

> **Regra de ouro de orquestração**: **enfileire DEPOIS de o estado do banco estar consistente.** Em `Delete`, primeiro `dao.delete(id)`, depois `producer.addDeleteJob(...)`. Se o consumer falhar, o banco já está limpo; se o producer falhar (Redis fora), o use case falha e o cliente vê o erro — escolha consciente do projeto, sem outbox.

### 11) Testes

#### Producer BullMQ — unit

Use `getQueueToken(QueueName.<X>)` e mocke `add`:

```13:27:src/app/upload-file/infra/driven/queue/bullmq/upload-file-queue-bullmq.producer.spec.ts
beforeEach(async() => {
  queueAdd.mockClear().mockResolvedValue(undefined);

  const module = await Test.createTestingModule({
    providers: [
      UploadFileQueueBullmqAdapterProducer,
      {
        provide: getQueueToken(QueueName.UploadFile),
        useValue: { add: queueAdd },
      },
    ],
  }).compile();

  sut = module.get(UploadFileQueueBullmqAdapterProducer);
});
```

Cubra:
- Job é adicionado com **`(JobName.<X>, data)`** exatamente
- Erro de `queue.add` **propaga** (não é capturado)

#### Consumer — unit

Use `createMock<I>()` para o gateway/use case que ele consome, e fabrique um `Job` parcial:

```12:33:src/app/upload-file/infra/drivers/queue/bullmq/upload-file-bullmq.consumer.spec.ts
function makeJob<T>(name: string, data: T): Job<T> {
  return { name, data } as Job<T>;
}

describe('UploadFileBullmqConsumer', () => {
  let sut: UploadFileBullmqConsumer;
  let uploadFileGateway: IUploadFileGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        UploadFileBullmqConsumer,
        {
          provide: TOKENS.UploadFileGateway,
          useValue: createMock<IUploadFileGateway>(),
        },
      ],
    }).compile();

    sut = module.get(UploadFileBullmqConsumer);
    uploadFileGateway = module.get(TOKENS.UploadFileGateway);
  });
```

Cubra:
- Cada `case` do `switch` (cada `JobName`)
- O **`default`** lança `AppException('Unknown job name: ...')`
- Erros do gateway/use case **propagam** (BullMQ retenta)

#### Use case que enfileira — unit + integration

Em `*.service.spec.ts`, mocke o producer com `createMock<I<Feature>QueueProducer>()`:

```typescript
{
  provide: TOKENS.UploadFileQueueProducer,
  useValue: createMock<IUploadFileQueueProducer>(),
}
```

Em `*.service.integration.spec.ts`, **use o fake** real:

```typescript
uploadQueue = module.get(TOKENS.UploadFileQueueProducer) as UploadFileQueueFakeAdapterProducer;
// ...
expect(uploadQueue.addedDeleteJobs).toHaveLength(1);
expect(uploadQueue.addedDeleteJobs[0].data.fileUrl).toBe('https://...');
```

O cast é seguro porque, em `NODE_ENV=test`, o token resolve para o fake.

### 12) Importar no `app.module.ts`

Não é preciso importar `<Feature>QueueModule` direto em `app.module.ts` — ele já vem dentro do `<Feature>Module` (que importa `<Feature>QueueModule.register()`) e é re-importado por features consumidoras conforme passo 10.

`QueueModule` global (`src/infra/queue/queue.module.ts`) já é importado uma vez pelo `InfraModule`.

## Convenções Obrigatórias

- **Enums centrais**: toda fila e todo job têm entrada em `QueueName` e `JobName` (`src/infra/queue/enums/`)
- **Token padrão**: `<Feature>QueueProducer` em `src/core/di/token.ts`
- **Interface padrão**: `I<Feature>QueueProducer` em `application/queue/`
- **Adapters**:
  - real: `<Feature>QueueBullmqAdapterProducer` em `infra/driven/queue/bullmq/`
  - fake: `<Feature>QueueFakeAdapterProducer` em `infra/driven/queue/fake/`
- **Consumer**: `<Feature>BullmqConsumer` em `infra/drivers/queue/bullmq/`, **estende `WorkerHost`**, **`@Processor(QueueName.<X>)`**
- **Job DTO**: classe pura serializável, em `application/queue/jobs/<verbo>-<recurso>-job.dto.ts`, sufixo `JobDto`
- **Module por feature**: `<Feature>QueueModule` com `static register()`, **sem `@Global`**, com:
  - `BullModule.registerQueue` **apenas em produção**
  - Consumer registrado **apenas em produção**
  - Producer registrado **sempre**, com `useClass: isTest ? Fake : Bullmq`
- **`defaultJobOptions`** mínimos: `removeOnComplete: true, removeOnFail: true`
- **Order of operations**: persiste estado primeiro, enfileira depois (sem outbox; sem job dispara antes do commit)
- **Em testes**: nunca importe `BullModule.registerQueue` — o `BullModule.forRootAsync` global também é silenciado em `NODE_ENV=test`. Verifique enfileiramento via fake.

## Anti-Padrões (Nunca Faça)

- ❌ Importar `bullmq` ou `@nestjs/bullmq` em `application/` ou `domain/`. Eles ficam **só** em `infra/{driven,drivers}/queue/bullmq/`.
- ❌ Passar entidade de domínio ou objeto não serializável no payload do job. Achate em primitivos.
- ❌ Enfileirar **antes** de o estado consistente ter sido persistido (cria janela em que o consumer roda em cima de dados que não existem mais / ainda não existem).
- ❌ Capturar erros no producer/consumer e silenciar. Erros do producer falham o use case; erros do consumer disparam retry do BullMQ.
- ❌ Usar `@Cron`/`@Interval` ou `setTimeout` em lugar de fila para tarefas que podem perder. Para agendamento, prefira `BullModule` (`{ delay, repeat }` no `add`).
- ❌ Criar um consumer global em `src/infra/queue/`. Consumers vivem na **feature** que faz sentido para o domínio (`src/app/<feature>/infra/drivers/queue/...`).
- ❌ Esquecer de adicionar `BullModule.registerQueue` no `<Feature>QueueModule` em produção — o `@InjectQueue` falha com erro críptico.
- ❌ Esquecer do `isTest` guard no `registerQueue` — em CI o Jest tenta conectar no Redis e quebra.
- ❌ Reusar o mesmo `JobName` para coisas diferentes em filas diferentes. **`JobName` é global**.
- ❌ Acessar Redis direto via `redis` (cliente do cache) para enfileirar. **Sempre via BullMQ**.

## Exemplo Completo

Linha do tempo de adicionar uma fila nova (`send-email`) hipotética:

1. **Enums**: adicionar `QueueName.SendEmail = 'send-email'` e `JobName.SendWelcomeEmail = 'send-welcome-email'` etc.
2. **Token**: `TOKENS.SendEmailQueueProducer = Symbol.for('SendEmailQueueProducer')` em `src/core/di/token.ts`
3. **DTO do job**: `src/app/send-email/application/queue/jobs/send-welcome-email-job.dto.ts`
4. **Interface**: `src/app/send-email/application/queue/send-email-queue-producer.interface.ts` com `addSendWelcomeEmailJob(data: SendWelcomeEmailJobDto): Promise<void>`
5. **Adapter real**: `src/app/send-email/infra/driven/queue/bullmq/send-email-queue-bullmq.producer.ts` com `@InjectQueue(QueueName.SendEmail)` + `this.queue.add(JobName.SendWelcomeEmail, data)`
6. **Adapter fake**: `src/app/send-email/infra/driven/queue/fake/send-email-queue-fake.producer.ts` com `addedSendWelcomeEmailJobs: Array<...>`
7. **Consumer**: `src/app/send-email/infra/drivers/queue/bullmq/send-email-bullmq.consumer.ts` com `@Processor(QueueName.SendEmail)` + `switch(job.name)`
8. **Module**: `src/app/send-email/application/queue/send-email-queue.module.ts` com `static register()` (registerQueue só em prod; consumer só em prod; producer sempre, fake/bullmq por NODE_ENV)
9. **Tests**: producer spec + consumer spec; integration tests dos use cases consumidores usam o fake
10. **Use case** que enfileira: `@Inject(TOKENS.SendEmailQueueProducer) private readonly producer: ISendEmailQueueProducer`
11. **Module consumidor**: importa `SendEmailQueueModule.register()` no array de `imports`

Resultado: ~9 arquivos novos para uma fila com 1 tipo de job. Para cada `JobName` adicional, somam-se 1 DTO + 1 método na interface + 1 método no adapter real + 1 array no fake + 1 `case` no consumer + specs correspondentes.

Use `src/app/upload-file/` como template canônico — é o único módulo do projeto com fila completa (producer + consumer + fake) hoje.
