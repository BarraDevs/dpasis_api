# Plano de correção — fluxo NFM (NFS-e + boleto)

**Data:** 2026-08-31
**Escopo:** `src/app/tax-invoice/nfm`, `src/app/tax-invoice/nfse`, `src/app/bank-payment`, `src/infra/nfs-generation` (Giss), `src/infra/bank-payment` (Inter).
**Objetivo:** plano único de correção para tornar o fluxo NFM resiliente, robusto e não-frágil. Cada ponto descreve o problema atual (com referência de código) e a correção a implementar, organizado em fases de prioridade.

---

## 1. Contexto do fluxo atual

Uma **NFM** é a face de negócio da **NFS-e** no ERP (serviços de manutenção). Fluxo:

1. `POST /admin/nfm` seleciona elegíveis (`FindElegibleClients`), persiste a NFM e dispara `IssueNfse` (RPS + status `PENDING` + job na fila BullMQ `nfse`).
2. `ProcessIssueNfseBatch` envia o lote ao **Giss** (`RecepcionarLoteRps`) → `SUBMITTED` + agenda poll (delay 30 s).
3. `ProcessPollNfseBatch` consulta o lote (`ConsultarLoteRps`) até 10 tentativas de 30 s → `ISSUED` → enfileira boleto.
4. `ProcessIssueNfseBankPayment` emite boleto no **Inter** (attempts=5, backoff) → `linkBankPayment` na NFS-e.
5. Recuperações existentes: retry manual de boleto (`POST /admin/bank-payment/nfm/:id`) e cancelamento síncrono da NFS-e via NFM (`POST /admin/nfm/:id/cancel`).

Máquina de estados da NFS-e (`NfseStatus`): `PENDING → SUBMITTED → PROCESSING → ISSUED → CANCELED`, com `FAILED` alcançável de qualquer estado intermediário. `isTerminal()` = apenas `ISSUED` ou `FAILED`.

**Fragilidade central:** depois que `nfm.nfseId` é gravado, `SaveElegibleNfms` dá skip. Qualquer falha posterior (job perdido, `FAILED` por timeout transitório, poll esgotado, boleto que retorna `null`) fica sem recuperação automática e sem endpoint de reenvio de RPS. O sistema trata "já tem NFS-e vinculada" como "terminou com sucesso", o que não é verdade. Não há cron interno, reconcile com a prefeitura, nem tabela local de cobrança; jobs de issue/poll têm 1 tentativa e `removeOnFail: true`.

---

## 2. Princípios de projeto (base de todas as correções)

1. **Reconciliar com a fonte de verdade externa antes de reenviar.** Giss e Inter são a verdade sobre nota e cobrança; nunca reemitir às cegas.
2. **Estado ambíguo ≠ falha de negócio.** Erro de rede/timeout não é rejeição fiscal; `FAILED` fica reservado para rejeição explícita.
3. **Jobs idempotentes + varredura periódica** são o mecanismo automático de maior alavancagem: recuperam sozinhos quase todo cenário transiente (Redis fora, crash de worker, deploy no meio do fluxo).
4. **HTTP manual é rede de segurança**, não o único caminho de recuperação.
5. **Cancelamento é saga**: fiscal (Giss) + financeiro (Inter) + estado local, com compensação.
6. **Uma única fonte de "hoje"/competência** em `America/Sao_Paulo` para todo o fluxo.

---

## 3. Pontos de ajuste

### Fase P0 — destravar emissões presas e eliminar duplicidade

#### P0.1 — Skip por status da NFS-e, não por `nfseId` + endpoint de reemissão com reconcile prévio

**Problema:** `SaveElegibleNfms` (`save-elegible-nfms.service.ts:62-64`) pula a NFM quando `existing?.nfseId` está preenchido, sem olhar o status da NFS-e vinculada. NFS-e `FAILED` (rejeição Giss, timeout de poll, erro de rede), `PENDING` sem job ou `SUBMITTED` órfã bloqueiam o cliente para sempre no mês — toda execução seguinte incrementa `skipped`. Não existe endpoint de reemissão de RPS; correção hoje só via SQL manual. Agravante: se o lote **foi** aceito na prefeitura e só a resposta se perdeu, o estado local mente `FAILED`, e reemissão cega do mesmo RPS pode rejeitar por duplicidade ou criar inconsistência fiscal (imposto duplicado para o cliente).

**Correção:**
1. No skip do `SaveElegibleNfms`, considerar apenas NFS-e com status `ISSUED` como "concluída" (política para `CANCELED` definida em P1.2). "Tem `nfseId`" deixa de significar "terminou com sucesso"; no mínimo, expor os órfãos no resultado.
2. Criar `POST /admin/nfm/:id/reissue-nfse`: permitido só para NFS-e `FAILED`/`PENDING` (política explícita); **antes** de reemitir, consultar a prefeitura — `ConsultarLoteRps` quando há protocolo; implementar `ConsultarNfsePorRps` para o caso sem protocolo. Se a nota existe no Giss → sincronizar (`markIssued` + boleto) em vez de reemitir. Se comprovadamente não existe → criar nova NFS-e (novo RPS), revincular `nfm.nfseId` e enfileirar, com trilha de auditoria.
3. Mesmo reconcile disponível como job automático (ver P0.4).

---

#### P0.2 — Erro ambíguo nunca vira `FAILED`: taxonomia de erros + re-poll

**Problema:** Dois pontos tratam "não sei o que aconteceu" como "falhou":
- `ProcessIssueNfseBatch` (`process-issue-nfse-batch.service.ts:105-115`): qualquer erro do `issueBatch` — inclusive timeout de rede **depois** de o Giss ter recebido o lote — chama `markFailed` e retorna com job Bull "sucesso". O protocolo se perde; o lote pode estar processando na prefeitura.
- `ProcessPollNfseBatch` (`process-poll-nfse-batch.service.ts:17-18, 91-96`): janela total de poll ≈ 5,5 min (10 tentativas × 30 s + delay inicial de 30 s). Se a prefeitura demorar mais, `markFailed` permanente mesmo com protocolo válido e lote ainda `PENDING` no Giss — a nota pode ser emitida depois com o ERP marcando `FAILED`.

O gateway Giss não diferencia falha fiscal de falha de rede: catch genérico → `ExternalApiError`, timeout e "RPS já informado" caem no mesmo balde.

**Correção:**
1. Taxonomia de erros no gateway Giss: `TRANSIENT` (rede/timeout/5xx) vs `BUSINESS` (rejeição explícita com código de erro fiscal). Só `BUSINESS` → `markFailed`; `TRANSIENT` mantém `PENDING`/`SUBMITTED` e deixa o Bull retryar com backoff.
2. Estado explícito para ambiguidade de envio (ex.: `SUBMIT_UNKNOWN`, ou `SUBMITTED` sem protocolo + flag), distinto de `FAILED` — o reconcile de P0.4 resolve pela prefeitura.
3. Após esgotar o máximo de tentativas de poll, **não** marcar `FAILED`: manter `SUBMITTED`/`PROCESSING` "aguardando reconcile". Aumentar tentativas com backoff crescente.
4. Criar `POST /admin/nfm/:id/repoll-nfse` (ou por `nfseId`): reexecuta `ConsultarLoteRps` para NFS-e travada/`FAILED` que tenha `batchProtocol` e conclui `markIssued`/`markFailed` com base na resposta real. Automatizável via reconciliação periódica (P0.4).

---

#### P0.3 — Robustez da fila: `attempts`, `jobId`, retenção de histórico, lock

**Problema:** Jobs de issue e poll são enfileirados **sem** `attempts` (default 1, `nfse-queue-bullmq.producer.ts:17-23`) e a fila usa `removeOnComplete/removeOnFail: true` (`nfse-queue.module.ts:31-34`). Consequências:
- Crash do worker, queda do Redis ou exceção não tratada (ex.: `edit` do Prisma falhando) ⇒ job some sem rastro; NFS-e presa em `PENDING`/`SUBMITTED`/`PROCESSING`.
- Zero histórico no Redis/Bull Board para depurar produção; sobram só os logs.
- `ProcessIssueNfseBatch` só dá short-circuit em `isIssued()` (`:32-34`) — reprocessar `FAILED`/`SUBMITTED` reenvia o mesmo RPS ao Giss.
- Job de boleto retenta 4xx do Inter (validação de documento/CEP) inutilmente 5×, depois some; `NfseNotFoundError` dentro do job também consome as 5 tentativas para erro permanente.

**Correção:**
1. `jobId` estável e determinístico por etapa: `nfse:{id}:issue|poll|bank` — deduplica enqueue repetido.
2. `attempts ≥ 3` + backoff nos jobs de issue e poll (idempotentes por construção: guards `isIssued()`/`canPoll()` já existem, reforçados pelo item 4).
3. Retenção de histórico: `removeOnComplete: { count: 1000 }` / `removeOnFail: { count: 5000 }` (ou por idade), ou DLQ dedicada. Nunca apagar job falho sem rastro.
4. Short-circuit por estado: estados que não devem reenviar RPS retornam cedo; antes de reenviar, consultar protocolo existente (integra P0.1/P0.2).
5. Distinguir erro permanente de transiente nos jobs de boleto: `BankPaymentRequestError` 4xx e `NfseNotFoundError` não retentam (descarta com registro); só transiente usa as tentativas.
6. Não completar job com sucesso após `markFailed` por erro transitório (o erro deve propagar para o Bull retryar).

---

#### P0.4 — Varredura periódica (sweeper/reconcile) de estados presos

**Problema:** Vários pontos deixam a NFS-e em estado não-terminal sem nenhum job vivo, e nada detecta:
- `IssueNfse` (`issue-nfse.service.ts:122-124`): `addIssueBatchJob` falha após o `save` (Redis fora) → `PENDING` eterno, com RPS já consumido e nada na prefeitura.
- Processo morre entre `edit(SUBMITTED)` e `addPollBatchJob` → protocolo órfão sem poll.
- `ProcessPollNfseBatch` (`:76`): `addIssueBankPaymentJob` falha depois do `markIssued` → boleto nunca agendado.

**Correção:** Job de varredura periódico (a cada N minutos) que busca NFS-e não-terminais com `updatedAt` mais antigo que X e re-enfileira o passo adequado (com `jobId` estável de P0.3):

| Estado detectado | Ação |
|---|---|
| `PENDING` antigo sem job | Reenqueue `issue-nfse-batch` |
| `SUBMITTED`/`PROCESSING` sem poll recente | Reenqueue poll ou consultar lote imediatamente |
| `ISSUED` sem `bankPaymentRequestCode` | Reenqueue boleto; se o Inter já tem cobrança pelo `seuNumero`, apenas vincular |
| `FAILED` transitório / `SUBMIT_UNKNOWN` com protocolo | Consultar RPS/lote; se emitida → `markIssued` + boleto; se não → reenviar RPS **uma vez** com auditoria |
| Pós-cancel | Garantir cancel Inter + unlink (ver P1.1) |

Essa varredura, combinada com jobs idempotentes e a taxonomia de P0.2, recupera sozinha quase todos os cenários de falha transiente, deixando para os endpoints manuais apenas os casos que exigem decisão humana (rejeição do Giss, dados inválidos). Idealmente evoluir para padrão outbox na transição persistência→fila.

---

#### P0.5 — Idempotência do boleto Inter (não duplicar cobrança)

**Problema:** `ProcessIssueNfseBankPayment` (`process-issue-nfse-bank-payment.service.ts:72-75`): se `issueBankPayment.execute` **sucede** no Inter mas o `edit` da NFS-e falha (ou o processo cai entre as duas linhas), o BullMQ reexecuta (attempts=5); na retentativa `hasBankPayment()` é `false` → **segundo boleto** para o mesmo cliente. O Inter **não deduplica** por `seuNumero`. Duas janelas de corrida agravam: dois workers passando em `hasBankPayment()` antes do link, e o retry manual (`IssueBankPaymentByNfmId`) rodando simultâneo ao job da fila — mesma raiz, mesma correção. Cliente pode pagar o boleto "errado"; conciliação manual.

**Correção:**
1. Antes de emitir, consultar o Inter por `seuNumero` (`GET /cobrancas?seuNumero=<nfseId>` via `list`) e **reaproveitar** cobrança existente em vez de emitir de novo. `seuNumero = String(nfseId).slice(0, 15)` passa a ser a chave oficial de conciliação — documentar o limite de 15 chars do Inter.
2. Persistir marcador local de emissão **antes** da chamada ao Inter: `bankPaymentStatus = REQUESTING` (pending → emitted), tratando retomada de forma idempotente. Alternativa mais completa: tabela local de cobrança.
3. Lock otimista / unique em `bankPaymentRequestCode` para fechar a corrida entre workers e entre job × retry manual.
4. Idempotency key no provedor, se disponível.

---

#### P0.6 — Timeout HTTP explícito em Giss e Inter + lock do worker

**Problema:** `GissSoapClient.postSoapRequest` (`giss-soap-client.ts:77-85`) e `InterCobrancaClient.request` não configuram `timeout` no axios (default = infinito). Conexão pendurada trava o worker (concorrência 1 por instância) e para o pipeline inteiro. No Giss há agravante: o lock padrão do BullMQ (~30 s) expira antes da chamada pendurada → Bull marca stalled, outro worker pega o mesmo job e **reenvia o mesmo RPS** — duplicidade de lote, stalls em cascata, carga na prefeitura.

**Correção:**
1. `timeout` explícito nas duas integrações (Giss: 60–120 s; Inter: 30–60 s).
2. `lockDuration` do worker ≥ timeout + margem, para o lock nunca expirar antes da chamada HTTP.
3. Idempotência por `jobId` (P0.3) e nunca reenviar RPS sem consultar protocolo/situação (P0.1/P0.2).

---

#### P0.7 — Atomicidade NFM↔NFS-e e lock contra execução concorrente

**Problema:** Em `SaveElegibleNfms` (`save-elegible-nfms.service.ts:86-90`), a NFS-e é criada e **enfileirada** antes de `nfm.nfseId` ser gravado. Se o `edit` falhar (crash, deploy, erro de rede com o banco), a próxima execução vê `nfseId = null` e emite **outra** NFS-e para o mesmo cliente/mês — a primeira segue viva na fila e vira nota órfã na prefeitura (nenhuma NFM aponta para ela). O mesmo acontece com dois `POST /admin/nfm` concorrentes (endpoint sem lock): ambos passam pelo `findByClientReferenceAndCnae` antes de qualquer `save` e emitem duas NFS-e — RPS queimados, notas fantasmas, skip na NFM "errada" (o unique da NFM não serializa o `IssueNfse`).

**Correção:**
1. Criar a NFS-e e gravar `nfm.nfseId` **na mesma transação**, antes de enfileirar — a fila só recebe o job depois do commit (com P0.4 cobrindo o caso "commit ok, enqueue falhou").
2. Lock de execução: advisory lock do Postgres por `(clientId, referenceMonth, referenceYear, cnaeNbsIndopId)` ou lock distribuído via Redis; alternativa: job único de geração na fila (ver P2.3).
3. Claim atômico + idempotência forte em `IssueNfse`.

---

### Fase P1 — consistência fiscal, financeira e operacional

#### P1.1 — Saga de cancelamento: Giss → Inter → estado local

**Problema:** `CancelNfm` → `CancelNfse` cancela só a nota no Giss. O boleto permanece **ativo e pagável no Inter** — cliente pode pagar serviço cancelado (risco financeiro direto). `CancelBankPayment` existe mas não é chamado no fluxo; se o operador cancelar só no Inter, `bankPaymentRequestCode` continua preenchido → retry de boleto recusa por "já vinculado" (vínculo zumbi). Além disso, `CancelNfse` (`cancel-nfse.service.ts:37-47`) faz o SOAP **antes** do `edit`: cancel confirmado na prefeitura + crash antes do `markCanceled` deixa o local `ISSUED` para sempre — novo cancel falha no Giss com "já cancelada" e a UI continua oferecendo cancelar.

**Correção:**
1. Saga no `CancelNfm`: cancelar no Giss → se `bankPaymentRequestCode` presente, cancelar a cobrança no Inter → limpar `bankPayment*` na NFS-e (ou marcar cancelado local). Compensação/registro se um lado falhar; definir política para boleto já pago.
2. Marcar "cancel pending" localmente **antes** do SOAP e reconciliar depois; consultar situação na Giss antes/depois do cancel para tolerar "já cancelada" (tratando como sucesso idempotente).
3. Endpoint de "forçar sync cancelado" / desvincular cobrança para reconciliação manual.
4. A varredura de P0.4 garante pós-cancel: cancel Inter + unlink pendentes.

---

#### P1.2 — `CANCELED` terminal + política de reemissão pós-cancelamento

**Problema:** `CANCELED` não é terminal (`nfse.entity.ts:51-57`): `isTerminal()` só cobre `ISSUED`/`FAILED`, `canPoll()` retorna true para cancelada com protocolo, e os guards de mutação não bloqueiam a partir de `CANCELED` — job de poll antigo pode "ressuscitar" a NFS-e (`markIssued`/`markProcessing`) após cancel fiscal. Ao mesmo tempo, após `CancelNfm` a NFM continua com `nfseId` preenchido → skip no cron, e a constraint única impede nova NFM: **não há caminho para emitir nota corrigida no mesmo mês** (caso clássico: cancelou por dado errado, quer reemitir).

**Correção:**
1. Incluir `CANCELED` em `isTerminal()`; bloquear `markSubmitted`/`markProcessing`/`markIssued`/`markFailed` a partir de `CANCELED`; cancelar/ignorar jobs pendentes ao cancelar.
2. Decidir política de reemissão pós-cancel: se desejada, o endpoint `reissue-nfse` de P0.1 aceita também NFS-e `CANCELED` (nova NFS-e, novo RPS, revincula a NFM).

---

#### P1.3 — Elegibilidade e calendário de emissão

**Problema:** A elegibilidade (`find-elegible-clients.service.ts:18-26`) é estritamente `dueDateDay == hoje`, o que gera quatro falhas independentes:
- **Ignora `emissionDay` e `months[]`** da config de fatura (`client-invoice-config.dto.ts`): cliente com emissão dia 5 e vencimento dia 20 só dispara no dia 20; configs anuais nunca são filtradas — emite fora do mês previsto ou não emite quando deveria.
- **Sem clamp para meses curtos:** `dueDateDay` 29–31 nunca casa em fevereiro (o VO do boleto faz clamp — `invoice-calendar-due-date.vo.ts:102` — a elegibilidade não) → mês inteiro sem NFM.
- **Dia de cron perdido = mês perdido:** sem catch-up, se o trigger não rodar num dia (deploy, feriado, incidente), os clientes daquele dia não entram em nenhuma execução futura do mês.
- **`dueDateType = DEADLINE` nunca entra:** quem usa prazo (`deadlineDays`, `dueDateDay null`) nunca casa com o filtro. Confirmar se é intencional.

Consequência adicional: como a NFM nasce no próprio dia do vencimento, o boleto vence **no dia da emissão** (cliente sem prazo); qualquer atraso que cruze a meia-noite, ou retry manual em mês seguinte (`referenceMonth` antigo, congelado no snapshot — `nfse-to-issue-bank-payment.mapper.ts:39-42`), gera `dataVencimento` no passado → Inter rejeita e **o endpoint de retry falha sempre** nesses casos.

**Correção:**
1. Disparo por `emissionDay` (+ `months` para configs anuais), separado do vencimento; manter o vencimento no VO de calendário já usado no boleto.
2. Clamp na elegibilidade: no último dia do mês, incluir também `dueDateDay > daysInMonth`.
3. Janela de catch-up: elegível se `emissionDay <= hoje` no mês corrente e sem NFM na competência (a constraint única já barra duplicação); aceitar parâmetro de data para reprocesso retroativo.
4. Decidir e implementar (ou documentar como fora de escopo) a elegibilidade para `dueDateType = DEADLINE`.
5. Na emissão do boleto: `dueDate = max(dataCalculada, hoje + carênciaMinima)` — nunca vencimento no passado, e o retry manual volta a funcionar em meses seguintes.

---

#### P1.4 — Timezone unificada (`America/Sao_Paulo`)

**Problema:** Três fontes de "hoje" divergentes: `FindElegibleClients` e `SaveElegibleNfms` usam `new Date()` na TZ do processo (`find-elegible-clients.service.ts:18`, `save-elegible-nfms.service.ts:35-37`); `IssueNfse` e o boleto usam Luxon `America/Sao_Paulo` (`issue-nfse.service.ts:83`). Servidor em UTC: entre 21:00 e 00:00 BRT o "dia de hoje" difere → clientes elegíveis do dia errado; na virada de mês, a NFM grava competência diferente da usada no boleto, e o unique da NFM no mês "errado" **bloqueia o mês certo**. Dockerfile Alpine sem `TZ`.

**Correção:** Util único de "hoje"/`referenceMonth`/`referenceYear` com zona fixa `America/Sao_Paulo` (Luxon) usado por elegibilidade, competência da NFM, snapshot e boleto; setar `TZ` no container como rede de segurança.

---

#### P1.5 — Falha de boleto visível: `bankPaymentStatus` + `bankPaymentError`

**Problema:** `ProcessIssueNfseBankPayment` engole erros de mapper/config com `return null` (`process-issue-nfse-bank-payment.service.ts:40-70`) — o job "sucede", o Bull não retenta e nada fica registrado na NFS-e. Erros do Inter usam as 5 tentativas e depois o job é removido (`removeOnFail: true`) sem rastro. Resultado: `ISSUED` sem boleto "para sempre", detectável só por inspeção manual de `bankPaymentRequestCode = null` ou log. No retry manual (`issue-bank-payment-by-nfm-id.service.ts:27-29`), o operador recebe erro genérico sem causa.

**Correção:**
1. Colunas `bankPaymentStatus` (integra o `REQUESTING` de P0.5) e `bankPaymentError` na NFS-e; persistir a causa em toda falha.
2. Erro de mapper/config **falha o job** (ou marca status `BANK_PAYMENT_FAILED`) em vez de `return null`.
3. Mensagem HTTP do retry manual com a causa real; alertas.
4. Filtro "emitida sem boleto" na listagem (ver P1.6); a varredura de P0.4 cobre o retry automático.

---

#### P1.6 — Observabilidade de órfãos: listagem, detalhe e filtros

**Problema:** A lista de NFMs filtra `nfseId: { not: null }` (`nfm-prisma.dao.ts:57-58`) — NFM cuja `IssueNfse` falhou fica **invisível** na UI (só o contador `failed` do POST ajuda); `mapToDto` (`:158-160`) lança `NfmNfseMissingError` se a row vier sem NFS-e. Além disso, o filtro de período usa `createdAt` (`:61-70`), não competência: reemissão/atraso no mês seguinte some do filtro "mês de competência".

**Correção:**
1. Listar NFMs sem NFS-e (filtro por status derivado / flag de órfã); detalhe tolerante a NFS-e ausente.
2. Filtro por `referenceMonth`/`referenceYear` (opcionalmente mantendo `createdAt`).
3. `GET /admin/nfm/orphans` (ou filtro na lista): `PENDING` antigos, `FAILED`, `ISSUED` sem boleto, NFM sem NFS-e — painel de "pendências de emissão".

---

#### P1.7 — Auditoria do cron legível e com alerta

**Problema:** `NfmCronRun` grava contadores e erros em JSON no banco, mas não há endpoint de leitura nem notificação — falha só é vista consultando a tabela. `resolveErrorMessage` grava só `message`, perdendo stack e classificação (transiente × permanente).

**Correção:** `GET /admin/nfm/cron-runs` (paginado); alerta (log estruturado/notificação) quando `failed > 0`; registrar erro com stack + classificação da taxonomia de P0.2.

---

### Fase P2 — robustez estrutural e DX

#### P2.1 — Lock otimista no `nfse.edit`

**Problema:** `NfseRepositoryAdapterPrisma.edit` regrava a linha inteira por `id`, sem `WHERE status = ...` nem versão — last-write-wins em corridas poll × cancel × boleto × retry manual × múltiplas instâncias de worker. Os guards de entidade leem estado possivelmente obsoleto (read-modify-write).

**Correção:** `updateMany({ where: { id, status: statusEsperado } })` verificando contagem afetada, ou coluna `version`. Complementa P0.5 (corrida de boleto) e P1.2 (guards de `CANCELED`).

---

#### P2.2 — Snapshot da NFM atualizado no retry

**Problema:** O snapshot imutável em `nfse.data` é um acerto (reprocessamento não depende de dados vivos do cliente), mas o retry reusa NFM existente sem regravar `data` (`save-elegible-nfms.service.ts:67-68`). Itens alterados entre tentativas → NFS-e com snapshot desatualizado ou inconsistente com `totalValueInCents`.

**Correção:** Atualizar snapshot e totais antes de `IssueNfse` no retry (e no `reissue-nfse` de P0.1).

---

#### P2.3 — Scheduler real + geração assíncrona

**Problema:** Não há `@Cron`/`ScheduleModule` no repositório — o trigger é `POST /admin/nfm` manual/externo, e o endpoint processa todos os elegíveis num loop HTTP síncrono: timeout de proxy/load balancer em bases grandes, e dependência de disparo externo confiável (raiz do "dia perdido" de P1.3).

**Correção:** Scheduler interno (Nest `@Cron` ou job recorrente na fila); geração como job assíncrono (o HTTP dispara e retorna); paginação interna dos elegíveis. O lock de P0.7 serializa cron × disparo manual.

---

#### P2.4 — Dados fiscais do mapper NFM→NFS-e

**Problemas:**
- `issValue` não enviado (`nfm-to-issue-nfse.mapper.ts` envia `issRate`/retenção) — gateway deriva da alíquota; arredondamento pode divergir do esperado fiscal.
- IBS/CBS hardcoded: `cClassTrib: '000001'`, `ibsCbsCst: '000'` (`nfm-to-issue-nfse.mapper.ts:47-48`) — pode ser inválido quando a reforma exigir classificação real.
- Descrição sem teto: join das descrições dos itens sem limite; ValidationPipe não roda no mapper interno; XML Giss pode estourar.

**Correção:** Calcular e persistir `issValue` com arredondamento alinhado ao município; classificação IBS/CBS configurável por empresa/serviço; truncar/validar descrição no mapper (ex.: 2000 chars).

---

#### P2.5 — Documentação frontend alinhada ao schema

**Problema:** `docs/frontend-integracao-nfm.md:223` afirma "NFM fica sem `nfseId`, status `FAILED`" — NFM não tem coluna de status (`prisma/schema/nfm.prisma`).

**Correção:** Ajustar doc; expor na API o status derivado da NFS-e (alinha com P1.6).

---

### Fase P3 — performance e higiene

| Item | Problema | Correção |
|---|---|---|
| P3.1 | N+1 na elegibilidade: `findAllClientItem` por cliente, sequencial — degrada linearmente | Batch/join dos itens |
| P3.2 | PFX recarregado a cada chamada SOAP — custo I/O/CPU em pico | Cache do certificado em memória |
| P3.3 | `seuNumero = String(nfseId).slice(0,15)` — vira chave de conciliação em P0.5 | Documentar limite de 15 chars do Inter e o papel de chave |
| P3.4 | `POST /admin/bank-payment` avulso não amarra NFS-e — cobrança órfã se usado fora do fluxo | Restringir/deprecar ou vincular obrigatoriamente |
| P3.5 | Sequência de RPS pode gerar buracos (incremento fora da transação do save) — Giss aceita gaps | Registrar como comportamento conhecido |

*(O timeout do client Inter já está coberto em P0.6.)*

---

## 4. Ordem de ataque e dependências

```text
P0.6 (timeout/lock) ─┐
P0.3 (fila)  ────────┼─► P0.4 (sweeper) ─► recuperação automática da maioria das falhas
P0.2 (taxonomia) ────┘
P0.1 (reissue c/ reconcile) — depende de P0.2 (ConsultarNfsePorRps / não-FAILED em rede)
P0.5 (boleto idempotente) — independente; habilita retry seguro do sweeper para boleto
P0.7 (atomicidade/lock) — independente; fecha a duplicação na origem
P1.x — após P0 (saga de cancel usa idempotência de P0.5; CANCELED terminal protege sweeper)
P2/P3 — incremental
```

Racional: P0 destrava notas/boletos presos e elimina duplicidade (fiscal e financeira) — os dois modos de falha com impacto direto no cliente. P1 fecha consistência fiscal/operacional e a visibilidade necessária para operar. P2/P3 são robustez estrutural, DX e higiene.

---

## 5. O que já está sólido (não mexer sem motivo)

- **RPS atômico** por empresa (`INSERT ... ON CONFLICT` / `getAndIncrement`) + unique `(companyId, rpsSeries, rpsNumber)` — sem race no incremento.
- **Unique da NFM** `(clientId, referenceMonth, referenceYear, cnaeNbsIndopId)` — barreira final contra duplicação da linha de negócio no mês.
- **Snapshot imutável** em `nfse.data` — reprocessamento não depende de dados vivos do cliente (guardar apenas o refresh do retry, P2.2).
- **Isolamento por grupo** no `SaveElegibleNfms` (`try/catch` por elegível) — uma falha não aborta o lote.
- **Job de boleto com `attempts: 5` + backoff** — estender o padrão para issue/poll (P0.3), não removê-lo.
- **Retry manual de boleto** (`POST /admin/bank-payment/nfm/:id`) — manter; melhorar erros (P1.5).
- **Cancel restrito a `ISSUED`** + motivos ABRASF validados.
- **Ordem "persistir antes de enfileirar"** — correta na intenção; o gap é a recuperação quando o segundo passo falha (resolvido por P0.4), não a ordem.
- **Fake adapters** de fila/Giss/Inter para testes (`NODE_ENV=test`).

---

*Antes de iniciar P0, validar hipóteses de produção (volume, SLAs Giss/Inter, timezone dos containers).*
