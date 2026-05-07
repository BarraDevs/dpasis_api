# /qa-tdd — Testes com TDD + QA sênior (matriz + padrões dpasis)

Use este comando quando quiser **gerar ou estender testes** (unit, integration, DTO, DAO, controller, domínio) com **dois trilhos obrigatórios**:

1. **TDD (Test-Driven Development)** — ciclo RED → GREEN → REFACTOR, com evidência de falha antes de “consertar”, sem código de produção novo sem teste falhando primeiro (quando o escopo incluir produção).
2. **QA sênior + padrões do repositório** — matriz exaustiva de cenários, co-locação, `*.spec.ts` / `*.integration.spec.ts`, `testing-strategy`, Rule 5 em `architecture-dpasis`.

O usuário pode anexar/colar um arquivo (`@caminho`) ou pedir cobertura para um módulo inteiro.

---

## ETAPA 0 — Carregar instruções (OBRIGATÓRIO)

**Antes de qualquer código ou plano detalhado**, leia **na íntegra** e mantenha em vigor até o fim:

1. **`.cursor/skills/qa-test-generator/SKILL.md`** — workflow de QA (descoberta → matriz → confirmação → implementação → verificação), mapeamento arquivo → tipo de spec, scaffolds, anti-padrões do projeto.
2. **`.cursor/skills/testing-strategy/SKILL.md`** — sufixos, `createMock`, `prisma.truncate`, estrutura canônica dos `describe`/`it`.

**TDD (Superpowers / skill anexada)**  
Se a skill **`test-driven-development`** estiver disponível no ambiente (ex.: plugin Superpowers), **leia-a na íntegra** também. Se não estiver disponível, aplique **literalmente** o “contrato mínimo TDD” abaixo — não substitua por “tests depois”.

### Contrato mínimo TDD (resumo executivo)

```
Regra de ferro: SEM CÓDIGO DE PRODUÇÃO NOVO SEM TESTE FALHANDO ANTES.
```

- **RED**: escreva **um** incremento mínimo de teste que descreve o comportamento desejado; rode `npm test -- <filtro>` e **confirme que falha pelo motivo certo** (comportamento ausente ou assert incorreto por falta de feature — não erro de sintaxe/import).
- **Só depois do RED comprovado** → **GREEN**: implemente **o mínimo** em produção (ou ajuste o teste se o “contrato” estava errado — mas aí volte ao RED).
- **REFACTOR**: com tudo verde, limpe duplicação e nomes; **rode os testes de novo** e mantenha verde.
- **Não pule “ver o vermelho”**: teste que passa no primeiro run sem você ter visto falha **não prova** que testa a coisa certa; ajuste o cenário até ter evidência de RED saudável, ou declare explicitamente que o comportamento já existia e o teste é **caracterização** (e por que o pass imediato é aceitável).

**Conflitos com o QA generator**  
O `qa-test-generator` pede matriz e confirmação **antes** de implementar. Mantenha isso: a matriz é o backlog; **cada linha da matriz** (ou lote mínimo combinado com o usuário) entra no ciclo TDD **uma de cada vez** — matriz não autoriza escrever 20 `it()` de uma vez sem RED/GREEN intermediários, a menos que o usuário peça explicitamente “só o arquivo inteiro” (nesse caso, documente o risco: perde-se a evidência TDD por incremento).

---

## ETAPA 1 — Descoberta e escopo

Siga a **Fase 1** do `qa-test-generator` (arquivo alvo, dependências, specs existentes, módulo Prisma quando couber).

Use `AskQuestion` quando precisar:

- Tipos de teste (unit / integration / DTO / DAO / controller / domínio).
- Preferência **incremental TDD** (padrão, recomendado) vs **lote** (aceitar só se o usuário insistir).

---

## ETAPA 2 — Matriz exaustiva (QA)

Siga a **Fase 2** do `qa-test-generator`: tabela de cenários (happy path, boundaries, erros de domínio, persistência, autorização, idempotência, etc.).

Não escreva specs ainda — só a matriz.

---

## ETAPA 3 — Confirmação

Siga a **Fase 3** do `qa-test-generator`: usuário aprova escopo/prioridades.

---

## ETAPA 4 — Implementação com TDD

Para **cada** incremento (ideal: **um** `it` ou um grupo mínimo indivisível, ex. `it.each` de mesmo comportamento):

1. **RED** — adicione o(s) teste(s); rode `npm test -- <arquivo.spec>`; capture evidência de falha esperada.
2. **GREEN** — se o incremento exigir produção nova, implemente o mínimo; se for **apenas testes** sobre código existente, ajuste até verde **sem** expandir escopo de produção além do necessário.
3. **REFACTOR** — opcional neste incremento; não misture novo comportamento no refactor.

Repita até cobrir a matriz aprovada.

**Regras do projeto (não negociáveis)** — ver detalhes no `qa-test-generator` + `testing-strategy`:

- Co-locação, `sut`, `makeValid<X>Input`, `createMock`, `AuthenticationGuardsModule` em controller unit, integration com `imports: [<Modulo>Module]` e `prisma.truncate()`, sem `Promise.all` frágil em integration com unicidade, mensagens de assert alinhadas a erros **pt-BR**, etc.

---

## ETAPA 5 — Verificação

Siga a **Fase 5** do `qa-test-generator`: `npm test` nos arquivos tocados, `npm run lint` quando houver `.ts` novo/alterado, relatório final com contagem e exclusões intencionais.

**Checklist TDD (obrigatório na mensagem final)**

- [ ] Cada novo comportamento em produção foi precedido de teste falhando (ou justificativa explícita + modo caracterização).
- [ ] Cada ciclo RED teve execução de teste com falha “certa” (não só compile error).
- [ ] Pós-GREEN (e pós-refactor) os testes relevantes passam; nada de suite vermelha ao entregar.

---

## Quando NÃO usar este comando

- **Só checklist de PR** sem escrever testes → use `/feature-checklist`.
- **Feature nova completa** (não só testes) → use `/nova-feature` (que já cita testes; você pode combinar com `/qa-tdd` na etapa de testes se quiser TDD explícito).
- **Protótipo descartável** — TDD relaxado só com acordo explícito do usuário (fora do padrão deste comando).

---

## Referências rápidas

| Recurso | Caminho |
|--------|---------|
| QA + matriz + scaffolds | `.cursor/skills/qa-test-generator/SKILL.md` |
| Política de specs do repo | `.cursor/skills/testing-strategy/SKILL.md` |
| Rule 5 (testes) | `.cursor/rules/architecture-dpasis.mdc` |
| TDD completo (se instalado) | skill **test-driven-development** (Superpowers) |
