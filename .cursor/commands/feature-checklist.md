# /feature-checklist — Checklist de nova funcionalidade (regra de checklist do RULES)

Use este comando quando precisar **aplicar apenas o checklist** de entrega de uma feature nova ou **revisar um PR / diff** contra esse checklist — sem rodar o pipeline completo do `/nova-feature`.

---

## Skill obrigatória (executar primeiro)

1. Abra e siga **`.cursor/skills/code-reviewer/SKILL.md`** como **primeiro passo** deste comando: princípios, categorias de análise (bugs, edge cases, segurança, performance, async, qualidade), severidades e **formato de saída** da revisão.
2. Para código deste projeto (NestJS/API/Prisma), carregue também **`.cursor/skills/code-reviewer/references/backend.md`** (e **`database.md`** se houver queries/migrations; **`security.md`** se tocar auth/autorização; **`infra.md`** se tocar Docker/CI/deploy), conforme a tabela "Orientações por Domínio" da própria skill.
3. A checklist arquitetural abaixo (Rule 11) e a revisão pela skill são **complementares**: a skill cobre bugs e riscos que o checklist não lista linha a linha; o checklist garante cobertura de entrega (schema, tokens, testes, build, etc.).

---

## Onde está a regra

1. Abra **`.cursor/rules/architecture-dpasis.mdc`** (ou o arquivo onde o projeto mantiver **Rule 11 — Checklist para Nova Funcionalidade** — em alguns clones isso aparece consolidado como `RULES.md`; use o arquivo que existir na pasta `.cursor/rules/`).
2. Localize o bloco cuja heading contém **`Checklist para Nova Funcionalidade`** (pode estar como `## Rule 11 — …`, **mas o número pode mudar**).
3. **Critério estável de fallback:** use a **última seção `## Rule …` antes de `## Referências`** — essa é sempre a regra de checklist de feature, independentemente do índice numérico.
4. Copie mentalmente a **lista de checkbox** daquela seção e trate-a como **fonte única** para esta tarefa.

Não assuma de memória qual é o número da rule; **leia o arquivo** sempre.

---

## Missão do agente

- **Revisão de código (skill):** quando o escopo incluir **trechos alterados ou arquivos concretos** (PR, branch, paths), aplique o **processo de revisão** da skill (`code-reviewer`): contexto → categorias → achados por severidade (🔴 🟡 🔵). Use o **formato de saída** da skill (**Resumo**, **Problemas Encontrados**, **O que está bem**) antes ou depois do detalhamento checklist, de forma que o resultado final contenha ambos quando houver código a inspecionar.
- **Checklist (Rule 11):** para **implementação em andamento** ou **revisão de entrega**: percorra **cada item** do checklist na ordem em que aparece no arquivo de rules.
- Para cada item do checklist, registre na análise: **cumprido**, **não aplicável (com justificativa breve)** ou **faltando / pendente / risco** — com referência a **arquivo ou trecho** quando possível.
- **Ao final**, consolide tudo na **tabela-resumo obrigatória** (vide secção seguinte): uma linha por etapa com **Situação** e **Justificativa** (obrigatória sempre que não for **Cumprida**).
- **Sem código no escopo:** se o usuário só quiser conferência conceitual (sem diff/arquivos), não invente revisão 🔴 sobre código; limite-se ao checklist e indique na entrega que a passagem pela skill ficou restrita aos itens verificáveis sem leitura de implementação.

---

## Relação com outras rules e skills

- O checklist é **subset** das regras gerais: ele não substitui `architecture-dpasis.mdc` / `RULES.md` inteiro quando há dúvida de arquitetura.
- Para o **roteiro mestre completo** (formulário, plano aprovável, scaffolding), prefira **`/nova-feature`**.
- **`.cursor/skills/code-reviewer/SKILL.md`** é **obrigatória** neste comando: ela estrutura a revisão técnica; as referências em `references/*.md` reforçam pontos por domínio.
- Skills pontuais (DAO, Prisma, testes, etc.) só entram se um item do checklist **exigir** detalhe — carregue a skill correspondente só nesse momento (evite ler todas as skills de uma vez).

---

## Formato obrigatório de entrega

### 1. Revisão de código (skill) — quando houver código no escopo

Incluir a estrutura definida na skill (**Resumo**, **Problemas Encontrados** com severidades, **O que está bem**). Se não houver achados em uma severidade, pode omitir essa subsection ou declarar explicitamente que não foram encontrados pontos 🔴.

### 2. Análise do checklist (opcional mas recomendada)

Texto ou subtítulos espelhando os bullets do arquivo de rules, com estado e referências quando útil (`[x]` / `[ ]` / N/A ou equivalente).

### 3. Resumo final (obrigatório): uma tabela

No **fim da resposta** (após revisão skill + texto do checklist, quando aplicável), **uma tabela** com **uma linha por item** do checklist copiado do rules (**mesma ordem**).

| Coluna | Conteúdo |
|--------|----------|
| **Etapa** | Nome/descrição curta do item (ou o primeiro trecho destacável em negrito de cada bullet, para ficar legível na tabela). |
| **Situação** | Uma de: **Cumprida** \| **Não cumprido** \| **Não aplicável** \| **Pendente / risco**. |
| **Justificativa** | Para **Situação = Cumprida**: opcionalmente `—` ou referência rápida (ex.: arquivo). Para **qualquer situação que não seja Cumprida**: obrigatório — motivo **breve**, bloqueador, arquivo em falta ou porque é N/A.

Exemplo (estrutura, não texto fixo):

```markdown
| Etapa | Situação | Justificativa |
| --- | --- | --- |
| Schema Prisma | Cumprida | `prisma/schema/foo.prisma` |
| `npm run lint` | Pendente | Ainda não executado neste branch |
```

**Correção rápida adjacente**  
Mesmo usando a tabela, pode acrescentar abaixo dela apenas um parágrafo com **itens não cumpridos** que são **bloqueadores de merge** e o próximo passo, **e** (se couber numa frase) os **bloqueadores 🔴** vindos da revisão pela skill.

---

## Regras de ouro deste comando

1. **Skill primeiro:** sempre carregar **`.cursor/skills/code-reviewer/SKILL.md`** e as `references/` pertinentes antes de declarar revisão completa quando há código.
2. **Fonte única do checklist:** o texto do checklist vale o que está **agora** no arquivo oficial de rules (ex.: `.cursor/rules/architecture-dpasis.mdc`), não cópias deste arquivo de comando nem memória de sessões antigas.
3. **Sem checklist fantasma:** se a heading mudar (ex.: "Checklist para release"), ainda assim use o bloco `## Rule … — …Checklist…` anterior a `## Referências`, ou pergunte ao usuário onde documentar o novo checklist oficial.
4. **`npm run lint`, `npm test`, `npm run build`:** só exija evidência quando o trabalho já deveria estar pronto para CI; caso contrário, marque como pendente ou "não executado ainda".
