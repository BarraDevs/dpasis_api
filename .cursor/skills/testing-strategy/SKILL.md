---
name: testing-strategy
description: >-
  Estratégia de testes do projeto: unit (com mocks) + integration (com banco
  real Prisma) + DTO validation. Use ao escrever/modificar testes, ao
  decidir entre mock e banco real, ao usar createMock do golevelup, ao
  testar use cases/controllers/DAOs/factories/VOs, ou quando o usuário
  disser "criar teste", "spec", "Jest", "mock", "test integration", "test
  unitário", "TDD", "como testar X", "teste de DTO", "teste do controller",
  "PrismaService.truncate".
---

# Estratégia de Testes

## Contexto

O projeto roda Jest em modo **`--runInBand`** (sequencial obrigatório, devido ao Prisma compartilhado) via `npm test`. Testes ficam **co-locados** com o código testado (mesmo diretório), sem pasta `__tests__/` separada.

São quatro tipos de teste convivendo no projeto:

| Tipo | Sufixo do arquivo | Estratégia | Quando |
|---|---|---|---|
| **Unit** | `*.spec.ts` | Mocks via `createMock<I>()` do `@golevelup/ts-jest` | Use cases, factories, VOs, helpers |
| **Integration** | `*.integration.spec.ts` | Importa o módulo real (`Test.createTestingModule({ imports: [FaqModule] })`) e usa `PrismaService.truncate()` em `beforeEach` | Mesmos use cases, mas validando contra banco |
| **DAO** | `<modulo>-prisma.dao.spec.ts` | Banco real | Validar queries Prisma |
| **DTO** | `<verbo>-<modulo>.dto.spec.ts` | `ValidationPipe` real | Validar decorators class-validator |

Geradores/templates antigos chegaram a prescrever "**sem mocks**" — porém o **código existente usa ambos**. O padrão **autoritativo é o que está no código**: cada use case tem `*.spec.ts` (unit com mocks) E `*.integration.spec.ts` (banco real). Esta skill documenta esse padrão real.

## Estrutura e Localização

```
src/app/<x>/<modulo>/application/usecases/<verbo>-<modulo>/
├── <verbo>-<modulo>.service.ts
├── <verbo>-<modulo>.service.spec.ts                # Unit
├── <verbo>-<modulo>.service.integration.spec.ts    # Integration
└── dtos/
    ├── <verbo>-<modulo>.dto.ts
    └── <verbo>-<modulo>.dto.spec.ts                # DTO validation

src/app/<x>/<modulo>/infra/driven/persistence/prisma/
├── <modulo>-prisma.dao.ts
└── <modulo>-prisma.dao.spec.ts                     # DAO contra banco
```

## Como Fazer

### 1) Teste unitário de use case (com mock)

```1:50:src/app/faq/application/usecases/create-faq/create-faq.service.spec.ts
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { CreateFaq } from './create-faq.service';
import { CreateFaqInputDto, CreateFaqOutputDto } from './dtos/create-faq.dto';

function makeValidCreateFaqInput(overrides: Partial<CreateFaqInputDto> = {}): CreateFaqInputDto {
  return {
    question: 'Como faço para recuperar minha senha?',
    answer: 'Clique em "Esqueci minha senha" na tela de login.',
    ...overrides,
  };
}

describe('CreateFaq - Unit tests', () => {
  let sut: CreateFaq;
  let faqDao: IFaqDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CreateFaq,
        {
          provide: TOKENS.FaqDao,
          useValue: createMock<IFaqDao>(),
        },
      ],
    }).compile();

    sut = module.get(CreateFaq);
    faqDao = module.get(TOKENS.FaqDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call faqDao.save with correct data', async() => {
    // Arrange
    const input = makeValidCreateFaqInput();
    const saveSpy = jest.spyOn(faqDao, 'save').mockResolvedValue(1);

    // Act
    await sut.execute(input);

    // Assert
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(input);
  });
```

Estrutura canônica:
- **`describe('<UseCase> - Unit tests', …)`**
- **`sut: <UseCase>`** (Subject Under Test — variável universal)
- **`makeValid<X>Input(overrides = {}): <X>InputDto`** helper no topo
- **`createMock<I>()`** do `@golevelup/ts-jest` para gerar mock tipado
- Comentários `// Arrange`, `// Act`, `// Assert` em cada `it()`
- `it('should be defined', () => expect(sut).toBeDefined())` é o primeiro teste

### 2) Teste de integração (banco real)

```1:51:src/app/faq/application/usecases/create-faq/create-faq.service.integration.spec.ts
import { Test } from '@nestjs/testing';
import { FaqModule } from 'src/app/faq/faq.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateFaq } from './create-faq.service';
import { CreateFaqInputDto } from './dtos/create-faq.dto';

describe('CreateFaq - Integration tests', () => {
  let sut: CreateFaq;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [FaqModule],
    }).compile();

    sut = module.get(CreateFaq);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should create faq and return id', async() => {
    // Arrange
    const input: CreateFaqInputDto = {
      question: 'Como recuperar minha senha?',
      answer: 'Clique em "Esqueci minha senha" na tela de login.',
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.faq.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.question).toBe(input.question);
    expect(saved?.answer).toBe(input.answer);
  });
```

Estrutura canônica:
- **`describe('<UseCase> - Integration tests', …)`**
- `Test.createTestingModule({ imports: [<Modulo>Module] })` — usa o módulo **real** (sem mocks)
- `beforeAll` instancia o módulo
- **`beforeEach` chama `prisma.truncate()`** (limpa todas as tabelas na ordem certa)
- **`afterAll` chama `prisma.truncate()` + `prisma.$disconnect()`**

### 3) Configuração de ambiente

Os testes usam `NODE_ENV=test` (definido em `package.json` script: `NODE_ENV=test jest --runInBand`). Isso ativa:
- `CacheFakeAdapterGateway` em vez de Redis
- `LoggerFakeAdapterGateway` em vez de Winston
- `CnpjLookupFakeAdapterGateway`, `UploadFakeAdapterGateway` etc.

`.env.test` aponta para um banco de testes específico — **não rode testes contra o banco de dev**.

### 4) Teste de DTO (validação class-validator)

Use `ValidationPipe` real para garantir o comportamento end-to-end:

```typescript
import { ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateFaqInputDto } from './create-faq.dto';

describe('CreateFaqInputDto', () => {
  function transform(plain: any): { errors: any[] } {
    const dto = plainToInstance(CreateFaqInputDto, plain);
    return { errors: validateSync(dto, { whitelist: true }) };
  }

  it('should reject empty question', () => {
    const { errors } = transform({ question: '', answer: 'a' });
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

### 5) Teste de DAO Prisma

Tem o mesmo formato de integration test, mas focado nas queries do adapter:

```typescript
describe('FaqDaoAdapterPrisma - Integration tests', () => {
  let sut: FaqDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [FaqModule],
    }).compile();

    sut = module.get(FaqDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });
  // ...
});
```

### 6) `PrismaService.truncate()`

Limpa tabelas **na ordem correta de FK**:

```10:69:src/infra/database/prisma/prisma.service.ts
  public async truncate() {
    await this.$transaction(async(tx) => {
      // Audit logs (sem dependências)
      await tx.auditLog.deleteMany();
      // 0. ClientInvoiceConfig (referencia Client, ClientAddress, Bank)
      await tx.clientInvoiceConfig.deleteMany();
      // ...
    });
  }
```

⚠️ Sempre que adicionar nova tabela, atualize o `truncate()` colocando-a na ordem certa de FK (filha antes de pai).

### 7) Concorrência: evitar `Promise.all` em testes

Em testes de integração, `Promise.all` pode quebrar com race conditions de unique constraint. **Prefira chamadas sequenciais**:

```typescript
// ❌ Pode falhar com unique constraint
await Promise.all([
  sut.execute(input1),
  sut.execute(input2),
]);

// ✅ Sequencial
await sut.execute(input1);
await sut.execute(input2);
```

### 8) Helpers de teste com unique fields

Para evitar colisão entre testes, use timestamps:

```typescript
function makeUniqueEmail(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2)}@x.com`;
}
```

### 9) `createMock<I>()`: features importantes

```typescript
import { createMock } from '@golevelup/ts-jest';
import type { IFaqDao } from '...';

const dao = createMock<IFaqDao>();
// Todos os métodos retornam undefined por padrão
// Use jest.spyOn para controlar:
jest.spyOn(dao, 'save').mockResolvedValue(42);
jest.spyOn(dao, 'findById').mockResolvedValue({ id: 1, ... });
```

## Convenções Obrigatórias

- **Co-locação**: spec ao lado do código (sem `__tests__/`)
- **`*.spec.ts`** = unit (mocks) | **`*.integration.spec.ts`** = banco real
- **Variável universal `sut`** para o objeto sob teste
- **`makeValid<X>Input(overrides = {}): <X>InputDto`** helper no topo de cada spec
- Triple-A com comentários `// Arrange`, `// Act`, `// Assert`
- **`describe('<Nome> - Unit tests' | '<Nome> - Integration tests', …)`**
- `it('should be defined', () => expect(sut).toBeDefined())` como primeiro teste
- Integration: `beforeEach` truncate + `afterAll` truncate + `$disconnect`
- Integration: `imports: [<Modulo>Module]` (módulo real, sem providers manuais)
- Mocks: `useValue: createMock<I>()` do `@golevelup/ts-jest`
- Sequência sobre paralelo em testes de integração

## Anti-Padrões (Nunca Faça)

- ❌ Pasta `__tests__/` ou `tests/` separada. Specs vão **junto** do código testado
- ❌ Sufixo `.test.ts`. O Jest está configurado para **`*.spec.ts`** (`testRegex`)
- ❌ Usar `Promise.all` em integration test que cria múltiplas entidades únicas
- ❌ Esquecer `prisma.truncate()` no `beforeEach` ⇒ contaminação entre testes
- ❌ Mockar `PrismaService` em vez de usar adapter fake. Os fakes são para gateways externos; o banco em teste é **real** (banco de teste isolado)
- ❌ Mockar use case dentro de outro use case. Se o use case A depende de B, exporte B do módulo origem e injete real
- ❌ Hardcodar IDs em test data. Sempre `Date.now()`/`Math.random()` para uniqueness
- ❌ Usar `expect(...).toBe(true)` quando você pode comparar exatamente: `toEqual({...})`, `toMatchObject({...})`

## Exemplo Completo

Estrutura completa de um spec unit (criar FAQ):

```16:82:src/app/faq/application/usecases/create-faq/create-faq.service.spec.ts
describe('CreateFaq - Unit tests', () => {
  let sut: CreateFaq;
  let faqDao: IFaqDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CreateFaq,
        {
          provide: TOKENS.FaqDao,
          useValue: createMock<IFaqDao>(),
        },
      ],
    }).compile();

    sut = module.get(CreateFaq);
    faqDao = module.get(TOKENS.FaqDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call faqDao.save with correct data', async() => {
    // Arrange
    const input = makeValidCreateFaqInput();
    const saveSpy = jest.spyOn(faqDao, 'save').mockResolvedValue(1);

    // Act
    await sut.execute(input);

    // Assert
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(input);
  });

  it('should return id from faqDao.save', async() => {
    // Arrange
    const input = makeValidCreateFaqInput();
    const id = 1;
    jest.spyOn(faqDao, 'save').mockResolvedValue(id);

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result).toEqual<CreateFaqOutputDto>({ id });
  });
});
```
