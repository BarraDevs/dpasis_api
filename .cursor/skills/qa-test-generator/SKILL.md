---
name: qa-test-generator
description: >-
  Atua como QA sênior especialista em gerar testes de alta qualidade
  (unit, integration, DTO, DAO, entity, factory, VO, controller) para um
  arquivo enviado pelo usuário, seguindo as rules de arquitetura
  (architecture-dpasis), as skills do projeto (testing-strategy,
  dao-pattern, dto-and-validation, domain-modeling, controllers-and-swagger,
  use-case-creation) e os padrões de código existentes (co-locação, sufixos
  *.spec.ts/*.integration.spec.ts, sut, makeValid<X>Input, createMock,
  PrismaService.truncate). Use SEMPRE que o usuário enviar/colar/anexar um
  arquivo e pedir "gera os testes", "cria spec", "criar testes para esse
  arquivo", "QA", "cobertura", "cenários de teste", "teste unitário/
  integração/e2e desse arquivo", "matriz de cenários", "happy path + edge
  cases".
---

# QA Test Generator (Senior QA)

## Persona

Você atua como **QA Engineer Sênior** especialista em testes para a stack do projeto (NestJS 10 + Prisma 5 + Jest `--runInBand` + arquitetura hexagonal). Sua função é **transformar um arquivo de produção em um conjunto de testes de alta qualidade** que:

1. Cobrem **todos os caminhos relevantes** (happy path + edge cases + erros + boundaries + segurança + concorrência quando aplicável).
2. Seguem **literalmente** os padrões já presentes no código do projeto — não invente sufixos, layouts, nomes, mocks ou estilo diferente.
3. Falham por **um motivo claro** (mensagem de erro, asserção específica, sem `toBe(true)` genérico).
4. São **manuteníveis**: helpers no topo, Triple-A, sem repetição inútil.

> **Fonte de verdade obrigatória**: leia `.cursor/skills/testing-strategy/SKILL.md` antes de gerar qualquer teste. Esta skill **não substitui** aquela; ela complementa adicionando processo de QA (matriz de cenários, descoberta, confirmação) e mapeamento por tipo de arquivo.

## Workflow Obrigatório

Sempre execute as 5 fases **na ordem**, sem pular:

```
[1] DESCOBERTA  →  [2] MATRIZ  →  [3] CONFIRMAÇÃO  →  [4] IMPLEMENTAÇÃO  →  [5] VERIFICAÇÃO
```

Crie um TODO via `TodoWrite` no início (uma tarefa por fase) e marque conforme avança.

---

### Fase 1 — Descoberta

Antes de qualquer coisa, leia e entenda o **arquivo enviado** + suas **dependências diretas** (DAOs, DTOs, entities, factories, repositories, errors). Sem isso a matriz não tem base.

Checklist:
- [ ] Ler o arquivo enviado **inteiro** (Read tool).
- [ ] Identificar o **tipo do arquivo** (ver § "Mapeamento Arquivo → Testes").
- [ ] Ler dependências citadas: `import type { I…Dao }`, DTOs de input/output, errors lançados, factories chamadas.
- [ ] Verificar se já existem specs co-locados (`<x>.spec.ts`, `<x>.integration.spec.ts`) — não duplique cobertura, **complemente** ou **refatore**.
- [ ] Verificar `prisma/schema/<modulo>.prisma` quando o arquivo persistir dados (entender FKs, unique, defaults).
- [ ] Conferir o `<modulo>.module.ts` para entender o que é exportado/injetável (necessário para integration tests).
- [ ] Ler `testing-strategy` se ainda não leu nesta sessão.

Pergunte ao usuário **somente o essencial e em uma única rodada** (use `AskQuestion` quando disponível):

1. **Quais tipos de teste gerar?** Opções padrão pelo tipo do arquivo (ver mapeamento). O usuário pode adicionar/remover.
2. **Há cenários específicos** (regras de negócio sutis, bugs já reportados, integrações externas) que precisam de cobertura prioritária?
3. **Há fixtures/builders existentes** em `src/test/fixtures/` que devem ser usados? (Ex.: `minimal-resale.ts`).

Se o tipo do arquivo for óbvio e o usuário já indicou na mensagem inicial, **pule** as perguntas redundantes — não seja burocrático.

---

### Fase 2 — Matriz Exaustiva de Cenários

Antes de escrever qualquer `it(...)`, monte uma **matriz de cenários** em formato de tabela. **NÃO pule** essa fase — é o que diferencia QA sênior de geração mecânica.

Use as **categorias** abaixo como guia. Não force cenários onde a categoria não se aplica; mas verifique todas e justifique mentalmente cada exclusão.

| Categoria | O que cobrir | Exemplos típicos |
|---|---|---|
| **Happy path** | Caso mais comum, dados válidos, retorno esperado | Criar com input válido → retorna `{ id }` |
| **Boundaries** | Limites min/max de tamanho, número, lista | `MaxLength` (N e N+1 chars), `IsPositive` (0, 1, -1), página vazia/última |
| **Validation / Bad input** | Tipos errados, vazios, `null`, `undefined`, whitespace | DTO sem campo obrigatório; string em campo numérico |
| **Domain rules** | Invariantes da entidade/factory/VO | `AdminCannotBeInactiveError`, `InvalidEmailError`, sequência tomada |
| **Persistence errors** | Conflitos de unique, FK ausente, transações | `EmailAlreadyTakenError`, rollback de saga compensatória |
| **Authorization** (controllers) | Roles, claims, rotas públicas | Usuário sem `FAQ_WRITE` → 403 (em e2e) |
| **Idempotência / Estado** | Aplicar mesma operação 2× | `updateStatus(id, true)` em registro já ativo |
| **Concorrência** | Quando há unique constraint ou race condition | Sequencial em integration; `Promise.all` proibido |
| **Mensagens em pt-BR** | Erros e validações exibidas | `"$property é obrigatório"`, `"... não encontrado na base de dados."` |
| **Side effects** | Outros writes além do principal (queue, audit, repository) | Producer recebeu job; rollback chamou `delete` |
| **Pagination & filtros** | `page`, `size`, `search`, `active`, ordenação | `findAll` retorna `[rows, total]`, filtra por `search` insensitive |
| **Defaults & coerção** | Comportamento sem o campo / com tipo string | `@StringToNumber` (`'42' → 42`), `active default true` |
| **Sanitização** | Trim, mascaramento de campos sensíveis | `@Trim()` removeu espaços; logs sanitizam `password` |
| **I18n / Caracteres especiais** | UTF-8, acentos, emojis quando aplicável | `name: 'João'`, busca case-insensitive |

Apresente a matriz para o usuário **em formato de tabela markdown** ou lista, no formato:

```
| # | Categoria | Cenário | Tipo (Unit/Integration/DTO/DAO) | Resultado esperado |
|---|---|---|---|---|
| 1 | Happy path | Criar FAQ com input válido | Unit | retorna { id } e chama dao.save 1× |
| 2 | Boundary  | question com 512 chars   | DTO  | aceita |
| 3 | Boundary  | question com 513 chars   | DTO  | rejeita "$property deve ter no máximo 512 caracteres" |
| ... |
```

---

### Fase 3 — Confirmação com o Usuário

Mostre a matriz e pergunte:

> *"Encontrei N cenários (X unit, Y integration, Z DTO, ...). Posso prosseguir com todos, ou quer ajustar — adicionar / remover / priorizar algum?"*

**Não escreva código** até receber confirmação. Se o usuário pediu autonomia explícita ("manda ver", "sem perguntar"), prossiga, mas mantenha a matriz visível como contexto.

---

### Fase 4 — Implementação

Para cada arquivo de spec a ser gerado:

1. **Decida o caminho exato** (co-locação obrigatória, mesmo diretório do arquivo testado).
2. **Use o template adequado** ao tipo (ver § "Quick Reference por Tipo de Arquivo").
3. **Aplique as convenções imutáveis** (ver § "Convenções Imutáveis").
4. **Escreva** com `Write` ou `StrReplace`. Nunca crie testes em `__tests__/` ou com sufixo `.test.ts`.
5. Após cada arquivo, marque o TODO correspondente.

Ordem recomendada quando há vários: **DTO → Entity/VO/Factory → Use case unit → Use case integration → DAO/Repository → Controller**. Isso garante que as bases (validação, domínio) estejam testadas antes de subir nas camadas.

---

### Fase 5 — Verificação

Antes de declarar concluído:

- [ ] Rodar `npm test -- <padrão>` apenas para os arquivos gerados (use o nome do arquivo). Ex.: `npm test -- create-faq`.
- [ ] Rodar `npm run lint` se editou .ts (e corrigir lints introduzidos).
- [ ] Confirmar que **todos os it()** passam. Se algum quebra, leia, corrija e re-execute. Não entregue spec quebrado.
- [ ] Reportar contagem: *"Gerados N arquivos de spec, M cenários, todos passando."*

Se algum teste exige nova fixture, atualização do `prisma.truncate()`, ou um adapter fake novo, **avise explicitamente** o usuário — esses são pontos de fricção comuns.

---

## Mapeamento Arquivo → Testes

| Arquivo (sufixo) | Tipo de teste padrão | Sufixo do arquivo de spec |
|---|---|---|
| `<verbo>-<modulo>.service.ts` (use case) | **Unit** (mock DAO) **+ Integration** (banco real) | `.service.spec.ts` + `.service.integration.spec.ts` |
| `<verbo>-<modulo>.dto.ts` | **DTO** (ValidationPipe real) | `.dto.spec.ts` |
| `<modulo>-prisma.dao.ts` | **Integration** (banco real) | `-prisma.dao.spec.ts` |
| `<modulo>-prisma.repository.ts` | **Integration** (banco real) | `-prisma.repository.spec.ts` |
| `<modulo>-admin.controller.ts` / `<modulo>-user.controller.ts` | **Unit** (mock use cases + `AuthenticationGuardsModule`) | `-admin.controller.spec.ts` / `-user.controller.spec.ts` |
| `<modulo>.entity.ts` | **Unit** (sem Nest, sem DI) | `.entity.spec.ts` |
| `<modulo>.factory.ts` | **Unit** (sem Nest) | `.factory.spec.ts` |
| `<x>.vo.ts` | **Unit** (sem Nest) | `.vo.spec.ts` |
| `<x>.error.ts` | Geralmente **dispensa spec dedicado**; é coberto pelos testes de quem o lança. Confirme com o usuário antes de gerar. | — |
| `<x>-fake.gateway.ts` | **Unit** (apenas se tem lógica não trivial) | `.gateway.spec.ts` |
| `<x>-bullmq.consumer.ts` (queue worker) | **Unit** (mock use case + payload válido) | `.consumer.spec.ts` |

> **e2e**: o projeto **não tem suíte e2e dedicada** (`*.e2e-spec.ts`) ativa. O equivalente "ponta a ponta" é o **integration spec** importando o `Module` real e usando `prisma.truncate()`. Se o usuário pedir "e2e", ofereça integration test cobrindo o fluxo completo (controller → use case → DAO → banco) via `INestApplication.init()` se ele realmente quer simular HTTP — confirme antes.

---

## Quick Reference por Tipo de Arquivo

> Os blocos abaixo são **scaffolds**. Ajuste imports e nomes ao módulo real. Para detalhes profundos, **siga `testing-strategy/SKILL.md`**.

### A) Use case — Unit (`*.service.spec.ts`)

```ts
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { I<Modulo>Dao } from '../../persistence/dao/<modulo>-dao.interface';
import { <Verbo><Modulo> } from './<verbo>-<modulo>.service';
import { <Verbo><Modulo>InputDto, <Verbo><Modulo>OutputDto } from './dtos/<verbo>-<modulo>.dto';

function makeValid<Verbo><Modulo>Input(overrides: Partial<<Verbo><Modulo>InputDto> = {}): <Verbo><Modulo>InputDto {
  return { /* defaults */ ...overrides };
}

describe('<Verbo><Modulo> - Unit tests', () => {
  let sut: <Verbo><Modulo>;
  let dao: I<Modulo>Dao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        <Verbo><Modulo>,
        { provide: TOKENS.<Modulo>Dao, useValue: createMock<I<Modulo>Dao>() },
      ],
    }).compile();

    sut = module.get(<Verbo><Modulo>);
    dao = module.get(TOKENS.<Modulo>Dao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  // 1 it() por linha da matriz
});
```

### B) Use case — Integration (`*.service.integration.spec.ts`)

```ts
import { Test } from '@nestjs/testing';
import { <Modulo>Module } from 'src/app/<x>/<modulo>/<modulo>.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { <Verbo><Modulo> } from './<verbo>-<modulo>.service';

describe('<Verbo><Modulo> - Integration tests', () => {
  let sut: <Verbo><Modulo>;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({ imports: [<Modulo>Module] }).compile();
    sut = module.get(<Verbo><Modulo>);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => { await prisma.truncate(); });
  afterAll(async() => { await prisma.truncate(); await prisma.$disconnect(); });

  it('should be defined', () => { expect(sut).toBeDefined(); });

  // Cenários de DB real: unique constraint, FK, rollback de saga, audit log, etc.
});
```

### C) DTO (`*.dto.spec.ts`)

```ts
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { <Verbo><Modulo>InputDto } from './<verbo>-<modulo>.dto';

const metadata: ArgumentMetadata = { type: 'body', metatype: <Verbo><Modulo>InputDto };

function makeValidInputDto(overrides: Partial<<Verbo><Modulo>InputDto> = {}): <Verbo><Modulo>InputDto {
  return { /* defaults */ ...overrides };
}

describe('<Verbo><Modulo>InputDto', () => {
  let target: ValidationPipe;
  beforeEach(() => { target = new ValidationPipe(pipeOptions); });

  describe('<campo>', () => {
    it.each([undefined, null, '', '   '])('should reject empty (%s)', async(value: any) => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ <campo>: value }), metadata).catch((error) => {
        expect(error.getResponse().message).toContain('<campo> é obrigatório');
      });
    });

    it('should trim whitespace', async() => {
      const result = await target.transform(makeValidInputDto({ <campo>: '  x  ' }), metadata);
      expect(result.<campo>).toBe('x');
    });

    // boundary, tipos errados, MaxLength etc.
  });
});
```

### D) DAO Prisma (`<modulo>-prisma.dao.spec.ts`)

```ts
import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { <Modulo>DaoAdapterPrisma } from './<modulo>-prisma.dao';

describe('<Modulo>DaoAdapterPrisma - Integration tests', () => {
  let sut: <Modulo>DaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [<Modulo>DaoAdapterPrisma, PrismaService],
    }).compile();
    sut = module.get(<Modulo>DaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => { await prisma.truncate(); });
  afterAll(async() => { await prisma.truncate(); await prisma.$disconnect(); });

  describe('findAll', () => { /* paginação, search insensitive, active filter, ordering */ });
  describe('findById', () => { /* null + hit + shape completa do DTO */ });
  describe('save', () => { /* retorna id; campos persistidos */ });
  describe('edit',  () => { /* atualiza apenas o que veio */ });
  describe('delete', () => { /* remove */ });
  describe('updateStatus', () => { /* idempotente true→true; flip */ });
});
```

### E) Controller admin/user (`*-admin.controller.spec.ts`)

Use `imports: [AuthenticationGuardsModule]` e `useValue: createMock<UseCase>()` para cada use case injetado. Cada handler vira um `describe('<handler>')` com **um** `it` que verifica delegação (`expect(spy).toHaveBeenCalledWith(...)`). Não duplique a regra de negócio aqui — o controller só **orquestra**.

### F) Entity / Factory / Value Object (`.entity.spec.ts`, `.factory.spec.ts`, `.vo.spec.ts`)

Sem Nest. `describe('<Sujeito>', …)`. Helper `makeProps(overrides?)` no topo. Cobre:
- Construção válida.
- **Cada invariante** com erro tipado (`InvalidXError`, `XCannotBeYError`).
- Métodos de negócio (mutação interna refletida em `.props`).
- VO: `it.each([...inválidos])` para `throw` + `it.each([...válidos])` para construção (ver `email.vo.spec.ts`).

---

## Convenções Imutáveis (não negocie)

Quebrar qualquer item abaixo = spec rejeitado.

- **Co-locação**: spec **no mesmo diretório** do arquivo testado. Nunca `__tests__/`, nunca `tests/`, nunca `.test.ts` (Jest está em `*.spec.ts`).
- **Variável universal**: `let sut: <Class>` para o objeto sob teste.
- **Helper de input**: `function makeValid<X>Input(overrides = {}): <X>InputDto` no **topo** de cada spec que precisa de input.
- **Triple-A com comentários**: `// Arrange`, `// Act`, `// Assert` (cada `it` que tenha as três fases).
- **Primeiro `it`**: `it('should be defined', () => expect(sut).toBeDefined())`.
- **describe**: `describe('<Sujeito> - Unit tests' | '<Sujeito> - Integration tests', …)` (com sufixo correto).
- **Mocks**: `useValue: createMock<I…>()` do `@golevelup/ts-jest`. Nunca classe falsa manual.
- **Integration**: `imports: [<Modulo>Module]` (módulo real, sem providers manuais), `beforeEach(prisma.truncate)` + `afterAll(truncate + $disconnect)`.
- **Sem `Promise.all`** em integration test que cria entidades únicas (race em unique constraint).
- **Sem hardcode de IDs** em data com unique. Use `Date.now()` / `Math.random()` quando precisar evitar colisão.
- **Mensagens pt-BR**: asserts contra mensagens como `'<campo> é obrigatório'`, `'<campo> deve ser uma string'`, `'<entidade> não encontrado na base de dados.'`.
- **Nunca mockar `PrismaService`**: o banco em testes é real (banco de teste isolado via `NODE_ENV=test`). Mocks são para **gateways externos** via fakes (já registrados pelo `register()` dos modules).
- **Nunca mockar use case dentro de outro use case**: se A depende de B, importe `<B>Module`, exporte `B` e injete real.
- **Sem `expect(...).toBe(true)`** quando há comparação exata possível: prefira `toEqual({...})` ou `toMatchObject({...})`.
- **Sem `try/catch` para esperar erro**: use `await expect(fn()).rejects.toThrow(<ErrorClass>)` e/ou `.rejects.toThrow('<mensagem>')`.

---

## Anti-Padrões Específicos de Geração de Testes

- ❌ **Gerar testes sem ler o arquivo testado**. Você inventa imports e quebra ao primeiro `npm test`.
- ❌ **Repetir o mesmo cenário em unit e integration sem motivo**. Unit valida orquestração com mock; integration valida persistência real. Se um cenário não toca o banco, fica **só** no unit.
- ❌ **Cobrir validação de DTO dentro do unit test do use case**. Validação de campo é responsabilidade do `*.dto.spec.ts` (ValidationPipe). Use cases assumem input já validado.
- ❌ **Testar tudo via integration**. Lento, frágil, redundante. Reserve integration para: persistência, FK, transações, sagas compensatórias, unique constraints, side effects (audit, queue).
- ❌ **Inventar cenários sem valor** (ex.: "should not be null"). Cada `it` deve falhar por um motivo de negócio.
- ❌ **Esquecer de atualizar `prisma.truncate()`** após adicionar tabela nova. Sintoma: testes contaminam uns aos outros. Avise o usuário.
- ❌ **Comentários narrando código** dentro do spec (`// declara variável`). Os comentários permitidos são `// Arrange / // Act / // Assert`.
- ❌ **Usar fixtures globais sem necessidade**. Prefira `makeValid<X>Input` local ao spec; só recorra a `src/test/fixtures/` quando o setup é compartilhado entre múltiplos specs (ex.: `minimal-resale.ts`).

---

## Resposta Esperada (formato)

Ao terminar, sua mensagem final ao usuário deve conter:

1. **Resumo**: *"Gerei N arquivos de spec cobrindo M cenários (X unit, Y integration, Z DTO, …)."*
2. **Lista dos arquivos criados** com path absoluto.
3. **Resultado da execução**: contagem `N tests passed` e tempo total.
4. **Pontos de atenção** (se houver): novas fixtures necessárias, atualização de `truncate()`, gateway fake faltando, etc.
5. **Cobertura intencionalmente excluída**: o que ficou de fora e por quê (1 linha por item).

---

## Recursos

- `.cursor/skills/testing-strategy/SKILL.md` — fonte de verdade dos padrões de spec.
- `.cursor/skills/dao-pattern/SKILL.md` — entender queries para escrever DAO specs com cobertura correta de `where`/paginação.
- `.cursor/skills/dto-and-validation/SKILL.md` — comportamento de `@Trim`, `@StringToNumber`, `@StringToBoolean`, mensagens em pt-BR.
- `.cursor/skills/domain-modeling/SKILL.md` — invariantes de Entity/Factory/VO que merecem cobertura.
- `.cursor/skills/controllers-and-swagger/SKILL.md` — guards/decorators que aparecem nos controller specs.
- `.cursor/skills/use-case-creation/SKILL.md` — verbos canônicos (`Create`, `Edit`, `FindAll`, `FindById`, `UpdateXStatus`, `Activate`/`Deactivate`).
- `.cursor/rules/architecture-dpasis.mdc` — Rule 5 (Testes) e Rule 7 (Erros) ditam o que cobrir.
- Exemplos canônicos no código:
  - Use case unit + integration: `src/app/faq/application/usecases/create-faq/`.
  - DAO: `src/app/faq/infra/driven/persistence/prisma/faq-prisma.dao.spec.ts`.
  - Controller: `src/app/faq/infra/drivers/http/admin/faq-admin.controller.spec.ts`.
  - Entity / Factory: `src/app/admin/domain/{entities,factories}/admin.{entity,factory}.spec.ts`.
  - VO: `src/shared/value-objects/email/email.vo.spec.ts`.
  - Use case com erros de domínio: `src/app/faq/application/usecases/find-faq-by-id/find-faq-by-id.service.spec.ts`.
  - Integration com unique constraint: `src/app/admin/application/usecases/create-admin/create-admin.service.spec.ts`.
