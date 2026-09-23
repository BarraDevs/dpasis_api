# /nova-feature — Implementar funcionalidade nova respeitando arquitetura

Você é um arquiteto sênior do projeto **dpasis_api** (NestJS + Prisma + Hexagonal/DDD-light + CASL). O usuário acabou de invocar este comando para implementar uma nova funcionalidade. Sua missão é entregar essa funcionalidade **seguindo rigorosamente os padrões do projeto**, sem improvisar.

---

## ETAPA 0 — Carregar memória arquitetural (OBRIGATÓRIO antes de qualquer coisa)

Antes de fazer qualquer pergunta ou propor solução, **leia nesta ordem**, em paralelo quando possível:

1. **`.cursor/context.md`** — passaporte arquitetural (stack, estrutura, regras de ouro, onde fica o quê)
2. **`.cursor/rules/architecture-dpasis.mdc`** — 11 regras absolutas que regem o projeto
3. **`.cursor/skills/adding-new-feature/SKILL.md`** — checklist mestre end-to-end
4. **`.cursor/skills/naming-conventions/SKILL.md`** — convenções de nomenclatura

Mantenha os 4 conteúdos no contexto de trabalho até o final da tarefa. **Nunca confie em memória prévia** sobre este projeto — sempre re-leia os arquivos quando precisar conferir uma convenção.

---

## ETAPA 1 — Levantamento de requisitos

Se o usuário não trouxe o pedido completo, apresente o **formulário abaixo** e peça que ele preencha. Se ele já forneceu informações no prompt, identifique o que está faltando e pergunte **apenas os itens faltantes** (não repita o formulário inteiro).

### Formulário: Nova Funcionalidade

```markdown
## 1. Tipo da funcionalidade
- [ ] Novo módulo CRUD (ex.: criar `client-attachment`)
- [ ] Novo use case dentro de módulo existente (ex.: `ImportFaqsFromCsv` em `faq/`)
- [ ] Nova rota em controller existente
- [ ] Outro: ___

## 2. Nome do módulo (se CRUD novo)
- **Nome em português:** (ex.: anexos, departamentos)
- **Nome em inglês (kebab-case singular):** (ex.: `client-attachment`)
- **Bounded context destino:** (ex.: `src/app/client/`, `src/app/global/`, ou raiz `src/app/`)

## 3. Estrutura do dado
| Campo | Tipo Prisma | Tipo TS | Validação | Limite |
|-------|-------------|---------|-----------|--------|
| (ex.: clientId) | Int | number | obrigatório, FK para Client | — |
| (ex.: description) | String @db.Text | string | obrigatório, trim | MaxLength 8192 |
| (ex.: link) | String @db.Text | string | obrigatório, trim | MaxLength 2048 |
| (ex.: active) | Boolean | boolean | default true | — |

## 4. Relacionamentos
- **Entidade pai (se houver):** (ex.: Client)
- **Cardinalidade:** (ex.: 1 cliente → N anexos)
- **`onDelete` da FK:** (Cascade | SetNull | Restrict)
- **Relação inversa no model pai:** (ex.: `attachments ClientAttachment[]`)

## 5. Use cases necessários
- [ ] Create
- [ ] Edit
- [ ] Delete
- [ ] FindAll (paginação + busca)
- [ ] FindById
- [ ] UpdateStatus (toggle active)
- [ ] Activate / Deactivate (separados)
- [ ] Outros customizados: ___

## 6. Filtros e busca em FindAll
- **Filtros obrigatórios:** (ex.: clientId)
- **Filtros opcionais:** (ex.: dateFrom, dateTo)
- **Campos de busca (`search`):** (ex.: description, link)

## 7. Rotas
- [ ] Admin (`admin/<modulo>`) — protegida por @RequiredRoles(ADMIN) + @RequiredClaims
- [ ] User (`user/<modulo>`) — pública ou autenticada por outro role
- **Sub-rotas customizadas:** (ex.: `/import`, `/export`)

## 8. Autorização (Claims)
- **Subject novo a registrar:** (ex.: `ClientAttachment`) → adicionar em `claim-subject.enum.ts`
- **Claims a registrar:** (ex.: `CLIENT_ATTACHMENT_READ`, `CLIENT_ATTACHMENT_WRITE`) → adicionar em `claim.ts`

## 9. Domínio
- [ ] CRUD simples (apenas DAO + erros) — referência: `src/app/faq/`
- [ ] DDD-light (entity + factory + repository + DAO) — referência: `src/app/admin/`
- **Invariantes/regras de negócio:** (ex.: "ao desativar um Client, todos os ClientItems são desativados em cascata"; "documento único por tenant")

## 10. Integrações
- **Outros módulos consumidos:** (ex.: `FindClientGroupById`, `FindCompanyById`, `CreateClientAddress`)
- **Gateways externos:** (ex.: `IUploadFileGateway`, `ICnpjLookupGateway`)
- **Saga compensatória necessária?** (sim/não — se sim, descrever steps)

## 11. Erros tipados
- **Not Found** (404): `<X>NotFoundError` (sempre)
- **Unicidade** (409): (ex.: `<X>AlreadyExistsError` para campo único)
- **Outros:** ___

## 12. Observações
- Módulo de referência preferido: (FAQ | Admin | Client | outro)
- Particularidades não cobertas pelo padrão: ___
```

---

## ETAPA 2 — Plano de implementação (apresente ANTES de codificar)

Depois de coletar os requisitos, **construa um plano detalhado** com base no checklist da Rule 11 (`.cursor/rules/architecture-dpasis.mdc`) e da skill `adding-new-feature`. O plano deve listar **exatamente os arquivos** que serão criados/modificados, na ordem correta.

Carregue **as skills específicas** que cobrem cada passo do plano:

| Passo | Skill obrigatória |
|---|---|
| Schema Prisma + truncate | `.cursor/skills/prisma-conventions/SKILL.md` |
| Tokens DI | `.cursor/skills/dependency-injection/SKILL.md` |
| Estrutura de pastas | `.cursor/skills/module-structure/SKILL.md` |
| Domínio (entity/factory/VO) | `.cursor/skills/domain-modeling/SKILL.md` |
| DTOs e validação | `.cursor/skills/dto-and-validation/SKILL.md` |
| Use cases | `.cursor/skills/use-case-creation/SKILL.md` |
| DAO | `.cursor/skills/dao-pattern/SKILL.md` |
| Repository (DDD) | `.cursor/skills/repository-pattern/SKILL.md` |
| Erros tipados | `.cursor/skills/error-handling/SKILL.md` |
| Controllers + Swagger | `.cursor/skills/controllers-and-swagger/SKILL.md` |
| Autorização | `.cursor/skills/authentication-and-authorization/SKILL.md` |
| Gateways externos (se aplicável) | `.cursor/skills/gateway-adapters/SKILL.md` |
| Filas / BullMQ (se aplicável) | `.cursor/skills/queue-bullmq/SKILL.md` |
| Testes (qualquer spec de arquivo novo) | **Obrigatório:** `.cursor/commands/qa-tdd.md` — **não** escreva testes só com `testing-strategy`. `/qa-tdd` carrega `qa-test-generator` + `testing-strategy` + TDD. |
| Doc integração frontend (após implementação) | `.cursor/skills/frontend-integration-docs/SKILL.md` |

Leia **somente** as skills relacionadas aos passos que serão executados. Não consuma contexto com skills irrelevantes ao caso.

### Formato do plano

Apresente o plano usando este template e **aguarde aprovação do usuário** antes de implementar:

```markdown
## Plano para `<nome-da-feature>`

**Tipo:** <CRUD novo | extensão de módulo | nova rota>
**Padrão:** <CRUD simples | DDD-light>
**Módulo de referência:** <FAQ | Admin | Client | …>

### Arquivos a criar
1. `prisma/schema/<modulo>.prisma` — model `<X>` com `@@map("<plural_snake>")`
2. `src/app/<contexto>/<modulo>/<modulo>.module.ts`
3. `src/app/<contexto>/<modulo>/domain/errors/<modulo>-not-found.error.ts`
4. ... (lista completa, na ordem do checklist)

### Arquivos a modificar
1. `src/core/di/token.ts` — adicionar `<X>Dao` (e `<X>Repository` se DDD)
2. `src/infra/database/prisma/prisma.service.ts` — adicionar `tx.<camelCase>.deleteMany()` em `truncate()`
3. `src/app/authentication/domain/authorization/claim-subject.enum.ts` — adicionar subject
4. `src/app/authentication/domain/authorization/claim.ts` — adicionar pares `<X>_READ`, `<X>_WRITE`
5. `src/app.module.ts` (ou agregador) — importar `<X>Module`

### Use cases a implementar
- `Create<X>` — valida unicidade, persiste via Repository (ou DAO em CRUD simples)
- `FindAll<X>` — usa `Pagination`, recebe `FindAll<X>QueryDto extends Queries`
- ... (lista por verbo com 1 linha de descrição cada)

### Rotas
- `POST /admin/<modulo>` — `@RequiredClaims(Claim.<X>_WRITE)`, body `Create<X>InputDto`, retorna `Create<X>OutputDto`
- ... (uma linha por rota)

### Testes (via `/qa-tdd` — não inventar specs neste plano)
- **Como:** na Etapa 3, **não** escrever `*.spec.ts` / `*.integration.spec.ts` “na mão”. Para **cada arquivo de produção novo** (e para arquivos de produção alterados que ganhem comportamento testável), executar o command **`.cursor/commands/qa-tdd.md`** como se o usuário tivesse invocado `/qa-tdd` naquele arquivo (ou no lote de arquivos novos, se o usuário pediu lote).
- **Listar aqui só os alvos** (produção → tipo de spec esperado). A matriz exaustiva, confirmação e ciclo RED→GREEN→REFACTOR ficam **dentro** do `/qa-tdd`.
- Use cases novos: `*.service.spec.ts` + `*.service.integration.spec.ts`
- DAO novo: `<modulo>-prisma.dao.spec.ts`
- Repository novo (DDD): `<modulo>-prisma.repository.spec.ts`
- DTOs novos: `*.dto.spec.ts`
- Entity / Factory / VO novos: `*.entity.spec.ts` / `*.factory.spec.ts` / `*.vo.spec.ts`
- Controller novo: `*-admin.controller.spec.ts` / `*-user.controller.spec.ts`

### Pontos de atenção
- (ex.: este módulo importa `forwardRef(() => XxxModule)` por causa do ciclo)
- (ex.: necessário rodar `npm run db:migration` antes dos testes)
- (ex.: invariante de domínio "documento único" implementada na Factory)
```

**Pergunte explicitamente**: "Posso prosseguir com a implementação seguindo este plano?"

---

## ETAPA 3 — Implementação

Após aprovação do plano, **execute na ordem do checklist** (Rule 11 / skill `adding-new-feature`):

1. Schema Prisma → atualizar `truncate()` → rodar `npm run db:migration` se aplicável
2. Tokens DI em `src/core/di/token.ts`
3. Estrutura de pastas
4. (DDD) Entity + Factory + VOs
5. DTOs com validação pt-BR
6. Ports (DAO/Repository interfaces)
7. Adapter Prisma (DAO/Repository) + persistence module
8. Use cases (com `@Injectable() + execute(...)`)
9. Erros tipados
10. Controllers (admin/user) com `@RequiredRoles + @RequiredClaims + @Swagger`
11. Claims (subject + catálogo)
12. Module raiz da feature
13. Importar no `app.module.ts` ou agregador
14. **Testes — obrigatoriamente via `/qa-tdd`** (ver subseção abaixo). **Proibido** gerar specs nesta etapa sem seguir `.cursor/commands/qa-tdd.md`.

### 14. Testes: delegar a `.cursor/commands/qa-tdd.md`

Assim que existir arquivo de produção novo (use case, DTO, DAO, repository, entity, factory, VO, controller, consumer, etc.) **e** for a hora de criar os testes dele:

1. **Leia na íntegra** `.cursor/commands/qa-tdd.md` e **execute aquele command** (Etapas 0–5 do `/qa-tdd`) para o arquivo — ou para o lote de arquivos novos, se o usuário pediu lote no `/qa-tdd`.
2. `/qa-tdd` já manda carregar `.cursor/skills/qa-test-generator/SKILL.md`, `.cursor/skills/testing-strategy/SKILL.md` e o contrato TDD. **Não** substitua isso por “copiar um spec de referência e preencher”.
3. **Um arquivo de produção novo = um ciclo `/qa-tdd`** (descoberta → matriz → confirmação → RED→GREEN→REFACTOR → verificação), salvo o usuário ter autorizado lote explícito.
4. Código de produção **já** escrito nesta Etapa 3: siga o `/qa-tdd` mesmo assim. Se o teste passar no primeiro run, trate como **caracterização** (justificativa obrigatória no relatório do `/qa-tdd`) — não invente RED falso. Preferível, quando o plano ainda não tiver produção daquele comportamento: **escrever o teste pelo `/qa-tdd` antes** (RED) e só então o mínimo de produção (GREEN).
5. Confirmação da matriz do `/qa-tdd` **não** é dispensada pela aprovação do plano desta feature. Plano lista *quais arquivos* terão spec; `/qa-tdd` lista *quais cenários*. Se o usuário já disse “autonomia / manda ver / sem perguntar” no `/nova-feature`, o `/qa-tdd` pode pular a pergunta da Fase 3, mas **a matriz continua obrigatória e visível**.
6. Só depois dos ciclos `/qa-tdd` dos arquivos novos: `npm run lint` e `npm test` no recorte tocado, como o `/qa-tdd` Etapa 5.

### Checagens contínuas durante a implementação

Conforme você for criando arquivos, verifique cada padrão:

- [ ] Pastas em `kebab-case singular`
- [ ] Classes em `PascalCase`, sem sufixos proibidos (`Service`, `UseCase`, `Entity` em entidade)
- [ ] DTOs como **classe**, com `@ApiProperty`/`@ApiPropertyOptional`
- [ ] Mensagens de validação em **pt-BR** com `$property`
- [ ] Where do DAO segue padrão `conditions[] + AND` (`.cursor/skills/dao-pattern/SKILL.md`, secção 3)
- [ ] `<Entity>Select satisfies Prisma.<Entity>Select` no topo do adapter
- [ ] `findMany` + `count` em `$transaction([...])`
- [ ] `paginationFactory(page, size)` usado
- [ ] Erros estendem `AppException` (sem `BadRequestException` do Nest)
- [ ] Tokens em `src/core/di/token.ts` (único lugar permitido)
- [ ] Rotas mais específicas (`:id/status`) ANTES de genéricas (`:id`)
- [ ] `@Swagger` em toda rota (sem `@ApiTags` direto)
- [ ] `@RequiredRoles` + `@RequiredClaims` em rotas administrativas
- [ ] Specs **só** via `/qa-tdd` (matriz + TDD); co-locação `*.spec.ts` / `*.integration.spec.ts`
- [ ] Integration test: `beforeEach(prisma.truncate)` + `afterAll(prisma.truncate + $disconnect)`

Use `npm run lint` e `npm test` ao final para validar (além da verificação de cada ciclo `/qa-tdd`).

---

## ETAPA 4 — Entrega

Quando terminar, apresente um resumo curto:

```markdown
## Implementação concluída

**Arquivos criados:** N
**Arquivos modificados:** M
**Use cases:** Create<X>, FindAll<X>, ... (total)
**Rotas:** POST /admin/<x>, GET /admin/<x>, ... (total)
**Testes:** P unit + Q integration (gerados **somente** via `/qa-tdd`; anexar contagem/cenários do relatório da Etapa 5 do `/qa-tdd`)
**Doc integração frontend (Etapa 5):** `docs/frontend-integracao-<contexto>.md` — ou *N/A* se não houver contrato admin/HTTP novo ou alterado

### Para validar localmente
1. `npm run db:migration` (se schema mudou)
2. `npm run lint`
3. `npm test`
4. `npm run build`

### Commits sugeridos
1. (ex.) `feat(<modulo>): adiciona schema Prisma e tokens DI`
2. (ex.) `feat(<modulo>): implementa CRUD de <X>`
3. (ex.) `test(<modulo>): adiciona testes unit e integration`

### Checagens manuais sugeridas
- [ ] Subir `npm run start:dev` e bater na rota via Swagger (`/swagger`)
- [ ] Confirmar que o admin tem as claims `<X>_READ`/`<X>_WRITE` (UI ou seed)
- [ ] Validar que `truncate()` foi atualizado e os integration tests passaram
```

---

## ETAPA 5 — Documentação de integração frontend (OBRIGATÓRIO após a Etapa 4)

Depois do resumo da Etapa 4 (`## Implementação concluída`), **sempre**:

1. **Leia** `.cursor/skills/frontend-integration-docs/SKILL.md` na íntegra e mantenha-a em vigor até concluir este passo.
2. **Execute o fluxo da skill**: escopo das mudanças de contrato → conferência no código (controllers, DTOs, Swagger, guards/claims) → redação → revisão (URLs e nomes de campos literais como na API).
3. **Persista** um arquivo em `docs/` no formato `frontend-integracao-<contexto>.md`, alinhado ao tom e à estrutura dos guias existentes referenciados na própria skill (`docs/frontend-integracao-*.md`).
4. Se a feature **não** alterar nem expor contrato HTTP relevante ao app admin (ex.: apenas worker interno, jobs, infra sem rota nova), registre isso **explicitamente** no final da Etapa 4 ou num parágrafo curto no próprio resumo — **sem** criar doc vazio só para cumprir formalidade.

Se upload/multipart/S3 estiver envolvido, cruze com `.cursor/skills/upload-file-flow/SKILL.md` conforme a skill de frontend-integration-docs.

---

## REGRAS DE OURO DESTE COMANDO

1. **NÃO comece a codificar sem ler `.cursor/context.md`, `.cursor/rules/architecture-dpasis.mdc` e `.cursor/skills/adding-new-feature/SKILL.md` primeiro.** Sem exceção.
2. **NÃO improvise convenções.** Se estiver em dúvida sobre nome/lugar/padrão, leia a skill correspondente em `.cursor/skills/`.
3. **NÃO pule passos do checklist.** Cada passo previne uma classe de bug. Se algum passo não se aplica, justifique no plano.
4. **Use exemplos reais do código** (FAQ para CRUD simples, Admin para DDD, Client para casos com sub-módulos). Quando precisar de inspiração, abra o módulo de referência e copie a estrutura.
5. **Aguarde aprovação do plano antes de implementar.** Nunca pule da Etapa 1 para a Etapa 3.
6. **Em caso de divergência:** RULES > código existente > skills > intuição. Se a skill estiver desatualizada vs o código, siga o código e mencione a divergência ao final para o usuário considerar atualizar a skill.
7. **Não encerre o comando sem a Etapa 5** quando houver contrato admin/HTTP novo ou alterado: documentação em `docs/frontend-integracao-<contexto>.md` conforme `.cursor/skills/frontend-integration-docs/SKILL.md`.
8. **Nunca escreva testes de arquivos novos sem o command `/qa-tdd`.** Fonte: `.cursor/commands/qa-tdd.md`. Skill `testing-strategy` sozinha **não** autoriza gerar spec neste fluxo.
