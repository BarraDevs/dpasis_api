# /feature-checklist — Checklist de nova funcionalidade (regra de checklist do RULES)

Use este comando quando precisar **aplicar apenas o checklist** de entrega de uma feature nova ou **revisar um PR / diff** contra esse checklist — sem rodar o pipeline completo do `/nova-feature`.

---

## Onde está a regra

1. Abra **`.cursor/rules/RULES.md`**.
2. Localize o bloco cuja heading contém **`Checklist para Nova Funcionalidade`** (hoje costuma ser `## Rule 11 — …`, **mas o número pode mudar** quando novas regras forem inseridas antes dela).
3. **Critério estável de fallback:** use a **última seção `## Rule …` antes de `## Referências`** — essa é sempre a regra de checklist de feature, independentemente do índice numérico.
4. Copie mentalmente a **lista de checkbox** daquela seção e trate-a como **fonte única** para esta tarefa.

Não assuma de memória qual é o número da rule; **leia o arquivo** sempre.

---

## Missão do agente

- Para **implementação em andamento** ou **revisão**: percorra **cada item** do checklist na ordem em que aparece em `RULES.md`.
- Para cada item, registre na análise: **cumprido**, **não aplicável (com justificativa breve)** ou **faltando / pendente / risco** — com referência a **arquivo ou trecho** quando possível.
- **Ao final**, consolide tudo na **tabela-resumo obrigatória** (vide secção seguinte): uma linha por etapa com **Situação** e **Justificativa** (obrigatória sempre que não for **Cumprida**).
- Se o usuário trouxe contexto (branch, módulo, PR), **focalize** nesse escopo; caso contrário, pergunte qual feature ou PR revisar antes de disparar inferências vagas.

---

## Relação com outras rules e skills

- O checklist é **subset** das regras gerais: ele não substitui `RULES.md` inteiro quando há dúvida de arquitetura.
- Para o **roteiro mestre completo** (formulário, plano aprovável, scaffolding), prefira **`/nova-feature`**.
- Skills pontuais (DAO, Prisma, testes, etc.) só entram se um item do checklist **exigir** detalhe — carregue a skill correspondente só nesse momento (evite ler todas as skills de uma vez).

---

## Formato obrigatório de entrega

1. **Análise** (opcional mas recomendada): texto ou subtítulos espelhando os bullets do `RULES.md`, com estado e referências quando útil (`[x]` / `[ ]` / N/A ou equivalente).

2. **Resumo final (obrigatório): uma tabela** no **fim da resposta**, com **uma linha por item** do checklist copiado de `RULES.md` (mesma ordem).

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
Mesmo usando a tabela, pode acrescentar abaixo dela apenas um parágrafo com **itens não cumpridos** que são **bloqueadores de merge** e o próximo passo.

---

## Regras de ouro deste comando

1. **Fonte única:** o texto do checklist vale o que está **agora** em `RULES.md`, não cópias deste arquivo de comando nem memória de sessões antigas.
2. **Sem checklist fantasma:** se a heading mudar (ex.: "Checklist para release"), ainda assim use o bloco `## Rule … — …Checklist…` anterior a `## Referências`, ou pergunte ao usuário onde documentar o novo checklist oficial.
3. **`npm run lint`, `npm test`, `npm run build`:** só exija evidência quando o trabalho já deveria estar pronto para CI; caso contrário, marque como pendente ou "não executado ainda".
