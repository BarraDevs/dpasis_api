# Auditoria de fechamento NFM — pré-homologação

- **Data:** 2026-09-08
- **Branch:** `fix/nfm-flow`
- **HEAD:** `77a9e4662634aeeeced22c4a69d21df48d33aa49` (`feat(nfm): enhance NFM flow with new job queues and automated processes`)
- **Working tree limpo?** Sim — o único arquivo fora do índice é `docs/prompt-auditoria-nfm-homologacao.md` (não rastreado). Toda a Onda 4 já está commitada; o snapshot de `git status` que abria a sessão estava defasado.
- **Escopo efetivamente lido:** `src/app/tax-invoice/nfm`, `src/app/tax-invoice/nfse`, `src/app/bank-payment`, `src/app/maintenance`, `src/app/audit`, `src/infra/nfs-generation`, `src/infra/bank-payment`, `src/infra/queue`, `src/infra/alert`, `src/infra/cache`, `src/infra/provider-attempt`, `src/shared/circuit-breaker`, `src/core/config`, `src/main.ts`, `prisma/schema`, `prisma/migrations`, `.env.example`/`.env.development`/`.env.production`/`.env.test`, `docker-compose.yml`, `docker-compose.dev.yml`, `Dockerfile`, `.dockerignore`, `README.md`, `docs/runbook-certificados.md`, `docs/frontend-integracao-nfm.md`, `src/app/tax-invoice/nfse/nfse-flow.e2e.integration.spec.ts`.
- **Comandos executados:** `npm test`, `npm run test:e2e`, `npm run build`, `npx eslint "src/**/*.ts"` (sem `--fix`, para não sujar a árvore), `npm run db:status`, inspeção de `pg_indexes`, e um teste controlado de `prisma db push` num banco descartável (`dpasis_audit_tmp`, criado e removido durante a auditoria).

---

> **Adendo de 2026-09-08, tarde — correções aplicadas.** Depois deste relatório entrou uma rodada de
> correção que fechou a parte de código e configuração dos três bloqueantes e dos nove achados novos.
> O veredito abaixo é o da auditoria; o estado atual está em **[Situação depois das correções](#situação-depois-das-correções)**,
> no fim do documento. Resumo: **continua NO-GO até a rotação do A1 junto à AC**, que é ação humana e
> é o que de fato fecha a exposição — as outras duas travas (índice parcial e canal de alerta) já
> saíram do caminho.

## Veredito

**NO-GO.**

O código do fluxo está, no geral, na altura do que a auditoria pediu: as três propriedades perigosas do §1 (efeito externo sem fronteira transacional, erro transitório tratado como permanente, chamada HTTP sem timeout) foram de fato fechadas, e o teste ponta a ponta passa nos cinco cenários. O bloqueio não é de engenharia de fluxo: **o certificado A1 de produção do CNPJ 02.099.923/0001-78, com chave privada, continua versionado no repositório** (`git ls-files` o lista no HEAD), junto do par mTLS do Inter — exatamente a condição que o próprio critério de veredito define como NO-GO, e o oposto do que `docs/runbook-certificados.md` afirma ter sido feito em 2026-09-02/03.

Somam-se dois problemas de ambiente que impedem a sessão com o cliente mesmo que o certificado saísse hoje: o `docker-compose.yml` sobe a aplicação com `npx prisma db push`, que **não cria** o índice parcial `nfses_one_active_per_nfm` (provado neste relatório) — ou seja, uma homologação levantada com o compose do próprio projeto perde a garantia de banco contra a NFS-e duplicada; e `SMTP_HOST`/`SMTP_PORT` valem `placeholder` em todos os arquivos de ambiente, então todo o canal de alerta da Onda 1 entrega zero e-mails.

**O que o cliente pode fazer amanhã:** nada em homologação ainda. O que dá para fazer amanhã é fechar os três itens acima (rotação real do A1 + purge do histórico, `migrate deploy` no lugar de `db push`, SMTP de verdade) — nenhum deles exige mudar o fluxo. Com isso feito, o veredito vira GO COM RESSALVAS.

---

## Scorecard dos achados

| ID | Título | Classificação | Evidência (arquivo:linha) | Bloqueia homologação? | Risco residual |
|---|---|---|---|---|---|
| **P0-01** | Segunda NFS-e no crash entre criar e vincular | **CORRIGIDO** | `nfse-prisma.repository.ts:74-129` (`$transaction`, `SELECT … FOR UPDATE` em `:78`, RPS em `:81-88`, vínculo dos dois lados em `:90-109`, outbox em `:111-118`); despacho pós-commit em `issue-nfse.service.ts:124-133`; índice em `prisma/migrations/20260903120000_nfse_idempotencia/migration.sql:28-30` | Não, no código. **Sim, no ambiente** — ver N-01 | Índice ausente num banco criado por `db push` |
| **P0-02** | Boleto não idempotente | **CORRIGIDO** | Payload congelado: `process-issue-nfse-bank-payment.service.ts:52-58`, `nfse-to-issue-bank-payment.mapper.ts:46-52,79-87`. Intenção antes do POST: `:101-106`. Consulta prévia: `:89-100`. Recusa por duplicidade → vínculo após GET conferindo `seuNumero`+`valor`+`vencimento`: `:186-212`, padrão do UUID em `inter-cobranca.client.ts:42`, só em `issue` em `:225-230`. `detail` antes de `title`: `inter-cobranca.client.ts:337-342` | Não | Nenhum relevante |
| **P0-03** | Timeout marca FAILED terminal | **CORRIGIDO COM DESVIO** | `process-issue-nfse-batch.service.ts:132-142` e `:180-190`; `E10`/`alreadySubmitted` → `AWAITING_PROVIDER` nos dois caminhos (`:132` e `process-poll-nfse-batch.service.ts:153-157`); rejeição de negócio → `REJECTED` (`:135`, `:158-163`); mensagens preservadas com código em `process-poll-nfse-batch.service.ts:152` | Não | Desvio: `AWAITING_PROVIDER` no lugar de `SUBMIT_UNKNOWN` — decisão da Onda 3, semântica idêntica |
| **P0-04** | Janela de poll de 5 min | **CORRIGIDO** | Ladder de ~1,5 dia em `process-poll-nfse-batch.service.ts:29-44`; `rescheduleOrFail` nunca marca `FAILED` (`:190-205`) | Não | Nenhum |
| **P0-05** | HTTP sem timeout | **CORRIGIDO** | `nfs-generation.module.ts:17,26` (60s), `bank-payment-inter.module.ts:10,15` (30s). O valor chega ao axios: nenhuma chamada sobrescreve `timeout` (`giss-soap-client.ts:107-115`, `inter-cobranca.client.ts:166-177`). `INTER_HTTP_TIMEOUT_MS` removida de todos os `.env` | Não | Nenhum |
| **P0-06** | Cancelar NFM não cancela boleto | **CORRIGIDO COM DESVIO** | `cancel-nfm.service.ts:44-46` (boleto **primeiro**, nota depois), falha não aborta (`:57-88`), reportada em `:52-53`; documentado em `docs/frontend-integracao-nfm.md:325-375` | Não | Nota cancelada com cobrança viva se o Inter recusar. A API e o contrato de frontend deixam explícito; **a tela em si não foi verificada** (fora deste repositório) |
| **P0-07** | Certificado A1 de produção no git | **ABERTO** | `git ls-files` lista `resources/files/nfs-generation/giss/DPA_TEC_…02099923000178.pfx`, `resources/files/bank-payment/inter/Sandbox_InterAPI_Certificado.crt` e `…_Chave.key` no HEAD. Nenhum commit os removeu (`git log --all --diff-filter=D -- 'resources/files/**'` só devolve os commits que renomearam `.gitignore`→`.gitkeep`). `.gitignore:59-63` foi adicionado em `b22e84c2` mas não destraqueia o que já estava no índice. O A1 tem `notBefore=2026-07-23`, `notAfter=2027-07-23` — anterior à rotação que `docs/runbook-certificados.md:109` diz ter ocorrido em 2026-09-03. `Dockerfile:45` copia `resources/` para a imagem de produção | **SIM — NO-GO** | Quem tem clone tem a credencial de assinatura fiscal da empresa. Um `.pfx` é atacável offline, sem limite de tentativas e sem rastro |
| **P1-01** | `removeOnFail: true` apaga o job | **CORRIGIDO** | `nfse-queue.module.ts:30,54-57` (retenção 30 dias); `attempts` 5/5/5/3/3 em `nfse-queue-bullmq.producer.ts:31,38,46,57,64`; Bull Board por fila em `nfse-queue.module.ts:59` | Não | Nenhum |
| **P1-02** | Estados não terminais sem dono | **CORRIGIDO** | `sweep-nfse-recovery.service.ts:47-100` (outbox, reconciliação vencida, `ISSUED` sem boleto, cobrança não confirmada); cron `*/5` em `nfse-alerts.scheduler.ts:39-47`; toda NFS-e nasce com `nextReconcileAt` em `nfse-prisma.repository.ts:28,98` | Não | Nenhum |
| **P1-03** | Falha de boleto engolida | **CORRIGIDO** | `process-issue-nfse-bank-payment.service.ts:151-172` grava motivo e devolve `PermanentProviderError`; `nfse-job.router.ts:49-51` converte em `UnrecoverableError`; no-ops (`!isIssued`, `hasBankPayment`) continuam `null` em `:42-47` | Não | Nenhum |
| **P1-04** | Sem rota de reemissão | **CORRIGIDO** | `reissue-nfm.service.ts:44-103` consulta o Giss antes (`:57`), 409 se a nota existe (`:58-60`) ou o lote processa (`:67-69`), reusa o mesmo RPS (`:92-94`); rota em `nfm-admin.controller.ts:143-157`; também `reconcile`, `provider-status`, `reconcile-period` | Não | `FAILED` não é reemissível — ver N-02 |
| **P1-05** | Duas requests → duas NFS-e | **CORRIGIDO** | Mesmo `reserve()` do P0-01; `P2002` → `NfmAlreadyHasActiveNfseError` em `nfse-prisma.repository.ts:124-126,139-147`, contado como `skipped` em `save-elegible-nfms.service.ts:110-113`. Índice confirmado no banco local (`pg_indexes`) | Não, no código. **Sim, no ambiente** — ver N-01 | Idem P0-01 |
| **P1-06** | Só disparo manual no dia exato | **CORRIGIDO** | `nfm-issuance.scheduler.ts:16` (06:00 America/Sao_Paulo); trava **fail-closed** em `run-daily-nfm-issuance.service.ts:41-52`; elegibilidade `dueDateDayMax` em `find-elegible-clients.service.ts:22,32-35`; piso de vencimento em `nfse-to-issue-bank-payment.mapper.ts:79-87` | Não | Nenhum |
| **P1-07** | Retry manual síncrono e duplicável | **CORRIGIDO COM DESVIO** | `issue-bank-payment-by-nfm-id.service.ts:17-33` — síncrono, sem lock por `nfseId`. A proteção herdada é `bankPaymentRequestedAt` (`process-issue-nfse-bank-payment.service.ts:89-100`), não `job.attemptsMade` | Não | Duplo clique **antes** da primeira tentativa depende da janela implícita de 30 min do Inter (que então cai no caminho de vínculo por duplicidade). Aceitável pelo critério do próprio escopo |
| **P1-08** | `POST /cobrancas` nunca confirmado | **CORRIGIDO** (metade urgente) | `confirm-nfse-bank-payment.service.ts:40-82`; `bankPaymentStatus`/`bankPaymentConfirmedAt` em `prisma/migrations/20260904120000_onda3_reconciliacao/migration.sql:10-11`; varredura em `sweep-nfse-recovery.service.ts:88-100`; alerta `FALHA_EMISSAO` em `sweep-nfse-alerts.service.ts:85-94` | Não | **O sistema não sabe se o cliente pagou** (R6). Webhook adiado; `confirmedAt` só prova que o boleto foi produzido |
| **P2-01** | `isTerminal()` sem CANCELED | **CORRIGIDO** | `nfse.entity.ts:77-79` (`isTerminal` inclui CANCELED e REJECTED), `:92-94` (`canSubmitToProvider` só PENDING sem protocolo), `:267-274` (`ensureMutable` barra ISSUED e CANCELED); casamento por RPS em `match-issued-note.ts:20-33` | Não | Nenhum |
| **P2-02** | RPS queimado fora da transação | **CORRIGIDO** | `nfse-prisma.repository.ts:81-88` — `getAndIncrement` dentro da `$transaction`; rollback devolve o número | Não | Nenhum |
| **P2-03** | Sem trilha GISS/Inter | **CORRIGIDO** | `nfse_attempts` gravada pelos adapters (`nfs-generation-giss.gateway.ts:252-268`, `inter-cobranca.client.ts:179-195`); recorder nunca lança (`provider-attempt-prisma.gateway.ts:15-38`) | Não | **Sem purga** — os corpos carregam dados do tomador e crescem sem limite. Dívida conhecida, adiada |
| **P2-04** | Logs sem `nfseId`/`correlationId` | **PARCIAL** (desvio aceito) | `nfseId` presente em todos os logs por nota do fluxo (emissão, poll, boleto, reconcile, cancel). Ausente só em logs de lote, onde não existe uma nota (`run-daily-nfm-issuance.service.ts:46,55,66,88`, `sweep-nfse-recovery.service.ts:128`, `reconcile-nfse-period.service.ts:82`). `correlationId` não existe em lugar nenhum do `src/` | Não | Correlacionar uma requisição HTTP com os jobs que ela gerou continua manual |
| **P2-05** | Auditoria só no HTTP de sucesso | **CORRIGIDO** | `audit.interceptor.ts:43-45` (`catchError` religado); `record-job-audit.service.ts:25-41` (`method: 'JOB'`, `url: job:{nome}`); filtro aceita `JOB` em `find-all-audit-log.dto.ts:16-24` | Não | Nenhum |
| **P2-06** | NFM reaproveitada com valor divergente | **ABERTO** | `save-elegible-nfms.service.ts:79-95` reaproveita a NFM existente com `totalValueInCents` congelado na criação (`:89`), enquanto `nfm-to-issue-nfse.mapper.ts:36` recalcula `servicesValue` a partir dos `clientItems` **atuais** a cada execução | Não sozinho — **listar no briefing** | NFS-e e boleto saem com o valor de hoje; a NFM guarda o valor do dia em que foi criada. Relatório fiscal e cobrança divergem sem nenhum aviso |
| **P2-07** | 429 como permanente | **CORRIGIDO** | Inter: `inter-cobranca.client.ts:204-237,281` (408/425/429 transitórios, 400 separado entre duplicidade e validação). Giss: `giss-error-classifier.ts:38-46` (parser incompreensível **não** é transitório) + `nfs-generation-giss.gateway.ts:237-249`. `Retry-After` reagenda o job em `nfse-job.router.ts:56-59` (`moveToDelayed` + `DelayedError`) | Não | Nenhum |
| **P2-08** | Sem breaker / fila única serial | **CORRIGIDO** | `queue-name.enum.ts:3-5` (três filas, `QueueName.Nfse` legada não existe); concorrência e limiter em `nfse-issue-bullmq.consumer.ts:14-17`, `nfse-poll-bullmq.consumer.ts:13-16`, `nfse-bank-payment-bullmq.consumer.ts:14-17`; breaker por município em `giss-soap-client.ts:92-94` + `circuit-breaker.ts:46-80`; `CircuitOpenError extends TransientProviderError` (`:4-9`) → `AWAITING_PROVIDER` | Não | Breaker é por processo, não distribuído — decisão registrada |
| **P2-09** | Sem alerta e `GET /admin/nfm` cego | **CORRIGIDO no código** | `AlertModule` SMTP em `alert.module.ts:20-22`; dez tipos de alerta com digest em `alert-window.ts:11-22`; filtros `status`/`stuckForHours`/`missingBankPayment` em `find-generated-nfms.dto.ts:49-70`; `GET /admin/metrics/nfse` em `nfse-metrics-admin.controller.ts:19-26` | **Sim, no ambiente** — ver N-03 | Com `SMTP_HOST=placeholder` nenhum alerta sai; a tela funciona, o e-mail não |
| **P2-10** | Certificado vence em silêncio | **CORRIGIDO** | `notAfter` nos dois loaders (`giss-pfx-loader.ts:89,110-116`, `inter-cert.loader.ts:37,47-64`); `GET /admin/health/certificates` em `health-admin.controller.ts:19-26`; alerta D-30/15/7 em `check-certificates.service.ts:16` + `sweep-nfse-alerts.service.ts:133-158`, cron 07:00 em `nfse-alerts.scheduler.ts:69-72` | Não | **Validade atual:** A1 do Giss até **2027-07-23** (OK); mTLS sandbox do Inter até **2026-09-25** — 17 dias. Uma homologação que se estenda além disso quebra o boleto no meio |
| **P2-11** | Alertas `A*` descartados | **CORRIGIDO** | `process-poll-nfse-batch.service.ts:134-137` persiste `providerAlerts`; `sweep-nfse-alerts.service.ts:107-120` marca como avisado **só** se o e-mail saiu; `markProviderAlertsNotified` em `nfse-prisma.repository.ts:198-207` | Não | Depende do SMTP para a marcação acontecer (o que, hoje, significa que nunca acontece) |
| **P2-12** | Alerta some se Redis/SMTP falham | **CORRIGIDO** | `sweep-nfse-alerts.service.ts:238-265`: falha de trava → envia assim mesmo (`:252`); `send()` devolve boolean (`alert.gateway.ts:9`, `alert-smtp.gateway.ts:18-51`); janela devolvida quando a entrega falha (`:260-262`) | Não | Nenhum |
| **P3-01** | Sem e2e do fluxo | **CORRIGIDO** | `nfse-flow.e2e.integration.spec.ts` — os cinco cenários existem (`:326`, `:361`, `:389`, `:408`, `:440`) e passam com Postgres e Redis reais | Não | Os provedores são fakes e o "crash" é simulado — ver §Testes |
| **P3-02** | PFX reparseado / Agent novo | **PARCIAL** (adiado) | Cache por `mtime`+tamanho existe para o Giss (`giss-pfx-loader.ts:50-58`); **não** existe para o Inter (`inter-cobranca.client.ts:44,311-319` guarda o material na instância, sem invalidação). `keepAlive` não implementado: `Agent` novo por chamada em `giss-soap-client.ts:78-83` e `inter-cobranca.client.ts:302-309` | Não | Trocar o certificado do Inter exige reiniciar a aplicação — o runbook §3 diz o contrário. Ver N-08 |
| **P3-03** | Env vars mortas | **CORRIGIDO** | `INTER_HTTP_TIMEOUT_MS` e `INVOICE_RETRY_DUE_DATE_DAYS` não existem mais em nenhum `.env` nem no `src/` (busca sem resultado) | Não | Achado novo do mesmo tipo: `CORS_ORIGIN` é obrigatória no Joi e tem leitor em `config.service.ts:38-40`, mas `main.ts:36` chama `app.enableCors()` sem argumento — ver N-09 |
| **P3-04** | Loop inteiro no HTTP | **ABERTO** | `save-elegible-nfms.service.ts:31-125` continua percorrendo todos os elegíveis dentro da requisição. O cron chama o mesmo use case (`run-daily-nfm-issuance.service.ts:64`), então o caminho feliz saiu do HTTP; a rota manual `POST /admin/nfm` (`nfm-admin.controller.ts:71-81`) não tem `@Throttle` próprio nem resposta 202 | Não sozinho — **listar no briefing** | Com centenas de elegíveis a rota manual estoura timeout de proxy. O trabalho não se perde (cada NFM commita sozinha), mas o operador não vê o resultado |

### Achados novos (não constavam da auditoria de 2026-09-01)

| ID | Título | Gravidade | Evidência | Bloqueia homologação? |
|---|---|---|---|---|
| **N-01** | `docker-compose.yml` sobe a aplicação com `prisma db push`, que não cria o índice parcial | **P0 de ambiente** | `docker-compose.yml:93` (`command: sh -c "npx prisma db push && node dist/src/main"`). O índice só existe no SQL da migration; **provado** num banco descartável: depois de `prisma db push` num banco vazio, `pg_indexes` não tem `nfses_one_active_per_nfm` (7 índices em `nfses`, nenhum parcial). Um índice já existente **sobrevive** a um `db push` posterior (também provado) | **SIM** — uma homologação criada com `npm run docker:prod` fica sem a garantia de banco do P0-01/P1-05 |
| **N-02** | NFS-e `FAILED` é beco sem saída operacional | **P1** | `nfm.entity.ts:35-37` (`hasNfse()` é verdadeiro para nota `FAILED`) → `save-elegible-nfms.service.ts:73-76` pula a NFM para sempre; `reissue-nfm.service.ts:19-22,53-55` só aceita `REJECTED`/`AWAITING_PROVIDER`; `reconcile-nfse.service.ts:196-204` retorna cedo para `FAILED`. E qualquer `NfsProviderConfigError` (certificado ausente, senha errada, PFX vencido — `giss-pfx-loader.ts:26,67,85,101,112`) leva a nota a `FAILED` (`process-issue-nfse-batch.service.ts:137-138,181-183`) | Com ressalva. Se o certificado/senha da homologação estiver errado no dia 1, **todas** as notas daquela rodada ficam presas sem rota de volta — só `UPDATE` no banco |
| **N-03** | SMTP não entrega em nenhum ambiente | **P1 de ambiente** | `SMTP_HOST=placeholder` e `SMTP_PORT=placeholder` em `.env.development`, `.env.production` e `.env.test`. `alert-smtp.gateway.ts:56-59` faz `Number('placeholder')` → `NaN` → `sendMail` falha, `send()` devolve `false` (`:49`) e o alerta é só uma linha de log | **SIM, na prática** — a operação fica cega. Todo o valor da Onda 1 depende deste canal |
| **N-04** | Perfil de produção desliga o Inter | **P1 de ambiente** | `.env.production`: `INTER_PROVIDER_ENABLED=false`, `INTER_CERT_PATH=` e `INTER_KEY_PATH=` vazios. `bank-payment.module.ts:33-36` só registra a estratégia com a flag em `true`; sem ela `BankPaymentStrategyAdapterGateway` recusa o provedor | Depende de qual perfil a homologação usar. Com `NODE_ENV=production` como está: **nenhum boleto sai** |
| **N-05** | Compose não passa nenhuma variável do Inter nem `GISS_CERT_PATH` | **P2 de ambiente** | `docker-compose.yml:50-86` passa só `GISS_CERT_PASSWORD`; `GISS_PROVIDER_ENABLED`, `INTER_*` e `GISS_CERT_PATH` ficam de fora. O boot não quebra porque as duas flags têm `default(false)` no Joi (`config.module.ts:49,61`) — falha silenciosamente depois | Sim, se a homologação usar o compose |
| **N-06** | README não documenta `migrate resolve --applied 0_init` | **P2** | `README.md:57-66` documenta apenas o `resolve` do rename da Onda 2. Não há nenhuma menção a `0_init` no arquivo. Um banco de homologação criado com `db push` vai falhar no primeiro `migrate deploy` tentando recriar tabelas que já existem | Sim, para o provisionamento |
| **N-07** | `.env.test` e `.env.development` apontam para o **mesmo** banco | **P2 de segurança operacional** | Ambos usam `postgresql://…@localhost:5432/dpasis`. `npm test` trunca todas as tabelas (`prisma.service.ts:22`). Foi o que produziu as 3 suítes vermelhas da primeira execução — colisão com um `test:e2e` concorrente no mesmo banco | Não bloqueia, mas **precisa de aviso**: rodar `npm test` numa máquina apontada para o banco de homologação apaga a homologação |
| **N-08** | Runbook promete troca de certificado a quente que só vale para o Giss | **P3** | `docs/runbook-certificados.md:77-79` afirma que sobrescrever o arquivo invalida o cache. Verdade para o Giss (`giss-pfx-loader.ts:50-58`), falso para o Inter (`inter-cobranca.client.ts:44,311-319`) | Não. Importa porque o certificado do Inter vence **2026-09-25**, dentro da janela de homologação |
| **N-09** | `CORS_ORIGIN` obrigatória, lida e nunca usada | **P3** | `config.module.ts:21` exige, `config.service.ts:38-40` lê, `main.ts:36` chama `app.enableCors()` sem argumento (libera qualquer origem) | Não |

---

## Matriz §4 — os 16 cenários contra o código atual

| # | Cenário | Comportamento HOJE | Atingiu o desejado? | Achado | Bloqueia? |
|---|---|---|---|---|---|
| 1 | Prefeitura offline por 3 dias | Ladder de poll de ~1,5 dia (`process-poll-nfse-batch.service.ts:29-37`); esgotado, vai a `AWAITING_PROVIDER` (`:190-197`), nunca `FAILED`. Reconciliação por RPS assume com escada de 5min→diária até 25 dias (`reconcile-nfse.service.ts:23-38,248-256`) | Sim | P0-04 | Não |
| 2 | Timeout no envio; a nota pode existir | `catch` classifica: só `NfsProviderConfigError` e rejeição de negócio são terminais; todo o resto vira `AWAITING_PROVIDER` (`process-issue-nfse-batch.service.ts:132-142,180-190`). `ConsultarNfsePorRps` é o único caminho de saída (`reconcile-nfse.service.ts:78-109`) | Sim, com desvio de nome (`AWAITING_PROVIDER` ≠ `SUBMIT_UNKNOWN`) | P0-03 | Não |
| 3 | Sucesso, processo morre antes de persistir | Job de poll com `attempts: 5` e retenção de 30 dias (`nfse-queue-bullmq.producer.ts:36-42`, `nfse-queue.module.ts:54-57`); `sweepReconciliation` reenfileira o que ficou (`sweep-nfse-recovery.service.ts:60-69`) | Sim | P1-01, P1-02 | Não |
| 4 | NFS-e emitida, boleto falha | `PermanentProviderError` com motivo persistido (`process-issue-nfse-bank-payment.service.ts:151-172`) → `UnrecoverableError` (`nfse-job.router.ts:49-51`); job retido 30 dias; alerta "ISSUED sem boleto" a partir de 1h (`sweep-nfse-alerts.service.ts:21,54-62`) | Sim no código; **o alerta não é entregue** | P1-03, P1-01, N-03 | Com ressalva |
| 5 | Boleto criado, falha ao persistir o ID | Intenção gravada antes do POST (`:101-106`); a tentativa seguinte consulta por `seuNumero` (`:89-100`); recusa por duplicidade vira vínculo depois de conferir os três campos (`:186-212`) | Sim | P0-02 | Não |
| 6 | Retry cego gera segunda NFS-e | Vínculo atômico na `reserve()`; reemissão sempre precedida de consulta ao Giss e sempre com o mesmo RPS (`reissue-nfm.service.ts:57-95`) | Sim no código; **sem o índice num banco criado por `db push`** | P0-01, P0-03, N-01 | Com ressalva |
| 7 | Duas requisições simultâneas | `FOR UPDATE` + índice parcial; `P2002` vira `skipped`. Provado no e2e (`nfse-flow.e2e.integration.spec.ts:389`) | Sim no código; mesma ressalva do índice | P1-05, N-01 | Com ressalva |
| 8 | Certificado expirado / OAuth inválido | `notAfter` validado nos dois loaders; healthcheck e alerta D-30/15/7. **Mas** cert quebrado → `NfsProviderConfigError` → `FAILED` terminal, sem rota de reemissão | Parcialmente | P2-10, **N-02** | Com ressalva |
| 9 | 429 no pico | Transitório nos dois provedores; `Retry-After` reagenda sem queimar tentativa; breaker por município | Sim | P2-07, P2-08 | Não |
| 10 | Rejeição por cadastro do tomador | Situação 3 → `REJECTED` (`process-poll-nfse-batch.service.ts:158-163`); `POST /admin/nfm/:id/reissue` consulta o Giss e reusa o RPS | Sim | P1-04 | Não |
| 11 | Deploy/restart com processos em voo | `app.enableShutdownHooks()` (`main.ts:41`); outbox cobre o trecho HTTP; `canSubmitToProvider()` barra reenvio cego (`process-issue-nfse-batch.service.ts:41-49`); consulta por `seuNumero` antes de repetir no Inter | Sim | P0-01/02/03 | Não |
| 12 | NFM cancelada depois da nota e do boleto | Boleto cancelado **primeiro** (`cancel-nfm.service.ts:44`), nota depois (`:46`); falha do boleto **não** aborta, volta na resposta | Parcialmente — inverte a ordem certa, mas não aborta | P0-06 | Com ressalva (documentado) |
| 13 | 500 NFMs pendentes, prefeitura volta | Notas sobrevivem em `AWAITING_PROVIDER`; filas separadas com concorrência 2/6/6 e limiter. **Mas** `SaveElegibleNfms` continua serial dentro da requisição | Parcialmente | P0-04, P2-08, P3-04 | Com ressalva |
| 14 | NFS-e devolvida com número diferente | `matchIssuedNote` casa por `rpsNumber`+`rpsSeries`; sem correspondência, `AWAITING_PROVIDER` e escala (`process-poll-nfse-batch.service.ts:117-127`) | Sim | P2-01 | Não (latente: 1 RPS por lote) |
| 15 | Boleto vence antes da emissão | Piso aplicado com corte de 19h59 (`nfse-to-issue-bank-payment.mapper.ts:79-87`), derivado de `issuedAt` | Parcialmente: uma nota **descoberta tarde** pela reconciliação tem `issuedAt` no passado, então o piso também fica no passado e o Inter recusa | P1-03, P2-07 | Com ressalva — listar no briefing |
| 16 | Inter aceita e a produção da cobrança falha | `ConfirmNfseBankPayment` consulta `GET /cobrancas/{codigo}` e só considera confirmado o que o provedor confirma (`confirm-nfse-bank-payment.service.ts:16-23,54-61`) | Sim para **emissão**; não para **pagamento** | P1-08 | Com ressalva (R6) |

---

## Desvios vs. correção proposta

1. **`AWAITING_PROVIDER` no lugar de `SUBMIT_UNKNOWN` (P0-03, §2.4).** A Onda 1 já tinha entregue o estado com a mesma semântica; a Onda 3 decidiu não criar um segundo nome. *Risco residual:* nenhum funcional. O diagrama da §2.4 fica desalinhado do enum real (`nfse-status.enum.ts:1-10`), o que confunde quem ler o documento antes do código.

2. **Cancelamento não aborta (P0-06).** A proposta era cancelar o boleto primeiro **e abortar** se ele falhasse. O código cancela o boleto primeiro (melhor que o descrito na Onda 1) mas segue em frente e cancela a nota mesmo com a cobrança viva. *Risco residual:* o cliente pode receber cobrança de nota cancelada. A resposta traz `bankPaymentCanceled: false` + `bankPaymentError`, e `docs/frontend-integracao-nfm.md:369-373` manda a UI mostrar aviso persistente — mas **este relatório não verificou a tela**, que vive em outro repositório. É o item que mais depende de confirmação humana antes da sessão.

3. **`correlationId` não entregue (P2-04).** Só `nfseId`. *Risco residual:* correlacionar "o operador apertou o botão às 10h03" com os jobs resultantes continua sendo trabalho manual de log.

4. **Métricas em JSON, não Prometheus (P2-09).** `GET /admin/metrics/nfse` devolve contagens e profundidade de fila. *Risco residual:* sem histórico — a tela mostra o agora, não a tendência. Aceitável para uma rodada de homologação.

5. **Retry manual do boleto sem lock (P1-07).** A idempotência vem de `bankPaymentRequestedAt` mais a janela implícita do Inter, não de um lock local. *Risco residual:* duplo clique **na primeira** tentativa depende do provedor recusar por duplicidade — que é justamente o caminho que a Onda 2 fez virar vínculo. Funciona, mas a garantia é do Inter, não nossa.

6. **Breaker por processo, não distribuído (P2-08).** Decisão explícita. *Risco residual:* com N réplicas, N disjuntores. Em homologação com uma instância, irrelevante.

7. **Piso de vencimento derivado de `issuedAt` (cenário 15).** Deliberado, para não quebrar a chave implícita do Inter. *Risco residual:* nota reconciliada semanas depois gera boleto com vencimento no passado e o Inter recusa com 4xx permanente. Cai no alerta de cobrança com falha — que hoje não é entregue.

---

## Adiados que o cliente vai sentir

| Item | Consequência prática na rodada |
|---|---|
| **Webhook do Inter / conciliação de pagamento (R6)** | O sistema sabe que o boleto **existe**; não sabe se foi **pago**. "Testar a baixa do pagamento" não está no produto. Precisa ser dito ao cliente na abertura da sessão, não descoberto no meio |
| **`RecepcionarLoteRpsSincrono` (Onda 3b)** | O caminho feliz continua sendo assíncrono: envia, recebe protocolo, consulta. A primeira nota leva pelo menos 30s (`ProcessIssueNfseBatch.FIRST_POLL_DELAY_MS`) para aparecer como `ISSUED`. Não é lentidão, é o desenho |
| **Lote de 50 RPS (RR5)** | Um RPS por lote (`process-issue-nfse-batch.service.ts:69-118`). O cenário 14 segue latente. Não testar lote grande |
| **Certificado mTLS de produção do Inter (RR1)** | Homologação usa **sandbox** (`INTER_API_URL=https://cdpj-sandbox.partners.uatinter.co` nos três ambientes). Nenhum boleto emitido nesta rodada é cobrável de verdade |
| **Purga de `nfse_attempts` (P2-03)** | A tabela guarda XML com dados do tomador e cresce sem limite. Não afeta a rodada; afeta a decisão de deixar isso em produção depois |
| **`keepAlive` nos agents HTTP (P3-02)** | Handshake TLS novo a cada chamada. Custo, não correção |

---

## Gate operacional (Fase 4)

| # | Item | Resultado | Evidência |
|---|---|---|---|
| 1 | `npm test` verde | **PASSOU** (com ressalva) | 747 suítes, 7919 testes passando; 3 suítes falharam por colisão de banco com um `test:e2e` concorrente (`Foreign key constraint violated: nfms_cnaeNbsIndopId_fkey` no `truncate`). Reexecutadas isoladas: **4 suítes, 29 testes, todos verdes**. Nenhuma delas pertence ao fluxo NFM |
| 2 | `npm run test:e2e` (QUEUE_E2E=true) | **PASSOU** | 5/5 cenários em 1,6 s com Postgres e Redis reais |
| 3 | `npm run build` | **PASSOU** | `nest build` sem saída de erro |
| 4 | Lint | **PASSOU** | `npx eslint "src/**/*.ts"` sem achados. Rodado **sem** `--fix` de propósito (`npm run lint` tem `--fix` e sujaria a árvore) |
| 5 | Migrations no repositório | **PASSOU parcialmente** | 4 migrations (`0_init`, `20260903120000_nfse_idempotencia`, `20260904120000_onda3_reconciliacao`, `20260904180000_onda4_alertas_e_observabilidade`); `npm run db:status` → "Database schema is up to date". **Mas** o README não documenta `migrate resolve --applied 0_init` (N-06), e o compose não usa `migrate deploy` (N-01) |
| 6 | Índice parcial existe no banco | **PASSOU no banco local / FALHOU no caminho de deploy** | `pg_indexes` confirma `nfses_one_active_per_nfm … WHERE (status <> ALL (ARRAY['FAILED','REJECTED']))`. Provado que `prisma db push` — o comando do `docker-compose.yml:93` — não o cria |
| 7 | Variáveis com leitor de verdade | **FALHOU** | `INTER_HTTP_TIMEOUT_MS`/`INVOICE_RETRY_DUE_DATE_DAYS` removidas (bom). Mas: `SMTP_*` são placeholders (N-03), `.env.production` desliga o Inter (N-04), o compose não passa `INTER_*`/`GISS_CERT_PATH` (N-05), e `CORS_ORIGIN` tem leitor sem consumidor (N-09) |
| 8 | Certificados fora do git, válidos, vistos pelo healthcheck | **FALHOU** | Os três continuam **dentro** do git (P0-07). Validade: A1 do Giss até 2027-07-23 (OK); mTLS sandbox do Inter até **2026-09-25** (17 dias — passa o piso de +7d, mas não cobre uma homologação longa). `GET /admin/health/certificates` existe e os enxerga |
| 9 | SMTP de homologação entrega | **FALHOU** | `SMTP_HOST=placeholder`. **A operação fica cega**: nenhum dos dez alertas sai, e `providerAlertedAt` nunca é marcado, então as ressalvas `A*` do fisco também não chegam a ninguém |
| 10 | Redis no compose; filas sobem; Bull Board autenticado | **PASSOU** | `docker-compose.yml:22-36` (Redis com healthcheck); três filas em `nfse-queue.module.ts:36-40`; Bull Board com `express-basic-auth` em `queue.module.ts:39-52` |
| 11 | Workers drenam no SIGTERM | **PASSOU** | `main.ts:41` `app.enableShutdownHooks()` |
| 12 | Reconciliação D+1 e varredura de 5 min agendadas | **PASSOU** | `nfse-alerts.scheduler.ts:39` (`*/5`), `:53` (07:30 D+1), `:23` (`*/15` alertas), `:60` (08:00 fechamento), `:69` (07:00 certificados). `ScheduleModule.forRoot()` ativo fora de teste (`maintenance.module.ts:24`) |
| 13 | Cron 06:00 São Paulo; rota manual segura | **PASSOU** | `nfm-issuance.scheduler.ts:16`. A rota manual é segura pelo mesmo `reserve()` + índice — **desde que o índice exista** (N-01). A trava do cron é fail-closed (`run-daily-nfm-issuance.service.ts:41-52`) |
| 14 | Um RPS por lote (RR5 adiado) | **CONFIRMADO** | `process-issue-nfse-batch.service.ts:69-118` monta `rpsList` com um elemento. Não testar lote de 50 |
| 15 | Sem webhook de pagamento | **CONFIRMADO** | Nenhuma rota `webhook` no `src/`. Avisar o cliente |
| 16 | Roteiro se o Inter recusar cancelar | **PARCIAL** | A resposta traz `bankPaymentError` e o contrato de frontend manda mostrar aviso persistente. Não existe runbook do que fazer **depois** — quem cancela a cobrança manualmente, por onde, em quanto tempo |
| 17 | Nenhum segredo no repositório | **FALHOU** | P0-07. Além disso `Dockerfile:45` copia `resources/` para a imagem de produção. Os seeds usam `GISS_CERT_PATH`, que hoje aponta para o arquivo versionado |
| 18 | (extra) Bancos de teste e desenvolvimento separados | **FALHOU** | `.env.test` e `.env.development` apontam para `localhost:5432/dpasis`; `npm test` trunca (N-07) |

---

## Testes

**O que rodou e passou**

- `npm test` — 747 suítes / 7927 testes. 7919 passaram, 5 skipped, 3 falharam por colisão de banco com uma execução concorrente; as três passam isoladas e nenhuma toca o fluxo NFM.
- `npm run test:e2e` — 5/5, com Postgres e Redis reais e BullMQ ligado (`QUEUE_E2E=true`):
  - `should carry a note from reservation to a linked charge, crossing both queues`
  - `should keep the note recoverable when the process dies between the commit and the dispatch`
  - `should let only one of two simultaneous issuances create a note for the same NFM`
  - `should never mark a note FAILED when the send timed out, and recover it by RPS`
  - `should link the existing charge when the bank refuses a duplicate, instead of leaving it orphaned`
- `npm run build` — sem erros.
- `npx eslint "src/**/*.ts"` — sem achados.

**O que os testes NÃO cobrem** (importa para quem for ler o verde como garantia)

- **Provedor real.** `NfsGenerationModule.register()` injeta o fake quando `NODE_ENV=test` (`nfs-generation.module.ts:20,30-33`), e o boleto usa `BankPaymentFakeAdapterGateway`. O e2e prova o **fluxo**: transação, fila, worker, guardas de estado, índice. Não prova nada sobre XML assinado, XSD do Giss, nem o contrato do Inter.
- **Crash de verdade.** O cenário 2 simula a morte do processo apagando o despacho e chamando `sweepOutbox()` diretamente (`nfse-flow.e2e.integration.spec.ts:361-388`). Nenhum processo é morto.
- **Timeout de verdade.** É um `Error` com `code: 'ECONNRESET'` injetado no fake (`:408-412`), não um socket pendurado atravessando o `HttpModule`.
- **Recusa por duplicidade do Inter.** O fake lança `BankPaymentAlreadyExistsError` diretamente; o parser do `detail` em prosa (`inter-cobranca.client.ts:42,225-230`) é coberto só por teste de unidade.
- **`prisma migrate deploy` num banco pré-existente.** Não testado — e é justamente o caminho que N-06 diz não estar documentado.

**Verificações fora da suíte, feitas nesta auditoria**

- Índices reais de `nfses` no banco local: o parcial existe, com o `WHERE` correto.
- `prisma db push` num banco descartável: **não** cria `nfses_one_active_per_nfm`; um índice já criado **sobrevive** a um `db push` posterior. Banco removido ao fim.
- Validade dos certificados configurados, lida direto dos arquivos: Giss `notBefore=2026-07-23` / `notAfter=2027-07-23`; Inter sandbox `notAfter=2026-09-25`.

---

## Briefing para o teste com o cliente

> **Este briefing só vale depois de o NO-GO ser resolvido.** Está escrito para a sessão que vem depois.

**Dados necessários antes de marcar**

- Um cliente com `generateInvoice = true`, `invoiceType = CONTRACT`, `active = true`, ao menos um `clientItem` ativo com `cnaeNbsIndop` que tenha `serviceListItemCode`.
- `client_invoice_config` com `generateNf = true` e `dueDateDay` **menor ou igual ao dia de hoje** (a elegibilidade é `<=`, não `=`).
- `nfs_provider_configs` da empresa com `certFilePath`, `certPasswordEnvVar`, `municipalRegistration`, `municipalTaxCode`, `issRate` e `vendorConfig.municipioSlug` preenchidos — a ausência de qualquer um destes leva a nota a `FAILED` **terminal** (N-02).
- Inter em sandbox: `INTER_PROVIDER_ENABLED=true`, `INTER_CERT_PATH`/`INTER_KEY_PATH` apontando para arquivos **fora** da árvore do projeto.
- SMTP real em `SMTP_HOST`/`SMTP_PORT`/`SMTP_TO` — senão nada do que segue gera aviso.

**Ordem dos testes**

1. `GET /admin/health/certificates` — confirmar `status: OK` antes de qualquer emissão. Se o Inter aparecer `EXPIRING`, contar os dias.
2. `GET /admin/nfm/elegible` — conferir que a lista é a esperada. Se vier vazia, o problema é cadastro, não emissão.
3. **Fechamento** com poucas dezenas de NFMs, não centenas. Ou esperar o cron das 06:00, ou `POST /admin/nfm`.
4. Acompanhar em `GET /admin/nfm?status=…` a nota andar `PENDING → SUBMITTED → PROCESSING → ISSUED`. A primeira consulta ao Giss acontece 30 s depois do envio.
5. Confirmar o boleto: `nfse.bankPaymentRequestCode` preenchido e, depois de ~10 min, `bankPaymentConfirmedAt`. `GET /admin/bank-payment/:codigoSolicitacao` mostra a situação no provedor.
6. **Cancelar** uma NFM: `POST /admin/nfm/:id/cancel`. Conferir os dois lados — NFS-e cancelada no portal do Giss **e** cobrança cancelada no Inter. Ler `bankPaymentCanceled` na resposta.
7. **Reemitir** uma NFM `REJECTED` depois de corrigir o cadastro: `POST /admin/nfm/:id/reissue`. A rota consulta o Giss antes; um `409` significa que a nota já existe lá — e isso é a proteção funcionando, não erro.
8. **Simular Giss lento**: cortar a rede do provedor durante um envio. O esperado é `AWAITING_PROVIDER`, **nunca** `FAILED`, e a reconciliação assumir.
9. Conferir `GET /admin/metrics/nfse`, os filtros de `GET /admin/nfm` (`status`, `stuckForHours`, `missingBankPayment`), o Bull Board em `/admin/queues` e a caixa de e-mail dos alertas.
10. `GET /admin/audit-log?method=JOB` — a trilha das transições assíncronas.

**O que observar**

Status da NFS-e, `errorMessage`, `bankPaymentErrorMessage`, `providerAlerts` (ressalvas do fisco chegam com a nota **emitida**), profundidade e falhas das filas no Bull Board, e a caixa de entrada do `SMTP_TO`.

**O que NÃO fazer**

- Não forçar duas emissões manuais "pra ver se duplica" contra o Giss real. A proteção é local; um teste mal desenhado no provedor custa ISS. Use o e2e com fakes para concorrência.
- Não testar lote de 50 RPS (adiado, cenário 14 latente).
- Não esperar baixa de pagamento — o webhook não existe.
- Não usar `SubstituirNfse` nem cancelamento com mais de 30 dias.
- **Não rodar `npm test` em nenhuma máquina cujo `.env.development` aponte para o banco de homologação** — a suíte trunca todas as tabelas (N-07).

**Critérios de aceite da rodada**

- Nenhuma NFM com mais de uma NFS-e viva.
- Nenhuma cobrança órfã no Inter (toda cobrança com `seuNumero` correspondendo a uma `nfse.bankPaymentRequestCode`).
- Nenhuma nota em `FAILED` por erro de infraestrutura — `FAILED` deve significar só configuração.
- Toda nota `ISSUED` com boleto confirmado em até 1h, ou um alerta explicando por quê.
- Cancelamento refletido nos dois provedores.

---

## O que falta ANTES da sessão com o cliente

Em ordem de prioridade. Nenhum item exige mudar o fluxo.

1. **Tirar os certificados do repositório de verdade (P0-07).** `git rm --cached` nos três arquivos, purgar o histórico com `git filter-repo`, forçar novo clone em todo mundo — e, o que mais importa, **rotacionar o A1 junto à AC e revogar o anterior**. O certificado hoje versionado (`notBefore=2026-07-23`) é o que está em uso: enquanto não for revogado, cada clone existente assina NFS-e em nome da empresa. Corrigir também `docs/runbook-certificados.md:6-9,108-109`, que registra como concluído o que não foi feito.
2. **Trocar `db push` por `migrate deploy` no `docker-compose.yml:93` (N-01).** Sem isso a homologação nasce sem `nfses_one_active_per_nfm` e a proteção contra nota duplicada existe só no código.
3. **SMTP de verdade (N-03).** Enquanto `SMTP_HOST=placeholder`, a Onda 1 inteira é teatro. Se não der para entregar e-mail na homologação, dizer isso ao cliente por escrito e combinar o plano B: SQL + Bull Board + `GET /admin/metrics/nfse`.
4. **Definir o perfil de ambiente da homologação (N-04, N-05).** `INTER_PROVIDER_ENABLED=true`, `INTER_API_URL` sandbox, `INTER_CERT_PATH`/`INTER_KEY_PATH` apontando para fora da árvore, e passar `INTER_*`, `GISS_CERT_PATH` e as duas flags no compose.
5. **Documentar o provisionamento do banco (N-06).** Incluir `prisma migrate resolve --applied 0_init` no README para bancos que já existiam sob `db push`.
6. **Decidir o que fazer com `FAILED` (N-02).** No mínimo, um runbook: hoje a saída é `UPDATE` no banco. O caminho barato é permitir `FAILED` na rota de reemissão — que já consulta o Giss antes de reenviar, então continua seguro.
7. **Confirmar com o frontend que o aviso do P0-06 está implementado.** O contrato manda; a tela não foi verificada aqui.
8. **Renovar o mTLS sandbox do Inter antes de 2026-09-25**, e lembrar que a troca dele **exige reiniciar** (N-08), ao contrário do que o runbook §3 promete.
9. **Separar `.env.test` de `.env.development` (N-07)** antes que alguém rode a suíte apontado para o banco errado.
10. **Listar no briefing do cliente**, sem corrigir agora: P2-06 (valor divergente em NFM reaproveitada), P3-04 (rota manual síncrona), cenário 15 (nota reconciliada tarde gera boleto com vencimento no passado), R6 (pagamento), RR5 (lote de 50), `keepAlive`.

---

## Situação depois das correções

> Rodada de correção de 2026-09-08, aplicada sobre `fix/nfm-flow`. Nenhuma onda tocou a máquina de
> estados, as filas, os adapters de provedor nem o `reserve()`: o fluxo auditado ficou intacto.
> Verificação: `npm test` 748 suítes / 7933 testes verdes, `npm run test:e2e` 5/5, `npm run build` e
> `npx eslint "src/**/*.ts"` limpos.

### Bloqueantes

| ID | Estado agora | O que mudou |
|---|---|---|
| **P0-07** | **PARCIAL — ainda bloqueia** | Os três arquivos saíram do índice (`git ls-files` filtrado por extensão de certificado devolve vazio) e continuam em disco em `resources/`, decisão da operação por causa da VPS compartilhada. O fallback legado saiu dos quatro seeds, que agora param com erro explícito sem `GISS_CERT_PATH` (`prisma/seeds/giss-cert-path.ts`). `.dockerignore` passou a barrar `**/*.pfx`, `**/*.key`, `**/*.crt` e afins — **verificado construindo a imagem**: `/app/resources` só carrega os `.gitkeep` e os templates de e-mail. O compose monta `./resources/files` somente leitura. **O que falta é humano e é o que fecha a exposição:** emitir o A1 novo, revogar o antigo (`serial=7ED08756A621FF735C09`) e purgar o histórico. Roteiro em `docs/runbook-certificados.md` §4. |
| **N-01** | **CORRIGIDO** | `docker-compose.yml` sobe com `prisma migrate deploy`. Verificado num banco novo (`dpasis_test`): as quatro migrations aplicam e `nfses_one_active_per_nfm` passa a existir — a mesma consulta que devolvia 0 sob `db push`. |
| **N-03** | **CORRIGIDO no código; credencial é humana** | `SMTP_PORT` virou `Joi.number().port()`: um valor de fachada agora derruba o boot com `Config validation error: "SMTP_PORT" must be a number` (verificado subindo a aplicação). `IAlertGateway` ganhou `verify()`, e `GET /admin/health/smtp` responde se o canal entrega **sem** mandar e-mail. Falta um servidor SMTP real no host de homologação — e agora dá para conferir antes da sessão, em vez de descobrir no incidente. |

### Achados novos

| ID | Estado agora | Evidência |
|---|---|---|
| **N-02** | **CORRIGIDO** | `FAILED` entrou em `REISSUABLE_STATUSES` (`reissue-nfm.service.ts`). A rota já consultava o Giss antes de reenviar, então a garantia é a mesma que torna `REJECTED` seguro. Dois testes novos: nota `FAILED` que o provedor não conhece volta a `PENDING` com o mesmo RPS; nota `FAILED` que o provedor tem responde 409. `docs/frontend-integracao-nfm.md` atualizado nos dois pontos que diziam o contrário. |
| **N-04, N-05** | **CORRIGIDO** | O serviço `api` do compose passou a usar `env_file: .env.production`, como o compose de desenvolvimento já fazia. `INTER_*`, `GISS_CERT_PATH` e as duas flags deixam de faltar. `.env.example` documenta o perfil que a homologação precisa. |
| **N-06** | **CORRIGIDO** | README ganhou a seção "Bancos que já existiam sob `db push`", com o `migrate resolve --applied 0_init`, e a nota de que `db push` não cria o índice parcial, com a consulta para conferir. |
| **N-07** | **CORRIGIDO** | `.env.test` aponta para `dpasis_test`, e `PrismaService.truncate()` recusa qualquer banco cujo nome não termine em `_test`. Verificado: com `DATABASE_URL` apontando para `dpasis`, a suíte de integração falha com a mensagem em vez de truncar. As três suítes que a auditoria viu vermelhas por colisão de banco passaram a rodar limpas. |
| **N-08** | **CORRIGIDO** | O cache do certificado do Inter saiu dos campos de `InterCobrancaClient` e `InterOauthClient` e foi para `InterCertLoader`, com chave por `mtime`+tamanho — o mesmo padrão do `GissPfxLoader`. Três testes novos cobrem reuso, recarga ao sobrescrever o arquivo e recusa de certificado vencido já em cache. `docs/runbook-certificados.md` §3 deixou de prometer o que não valia para o Inter. |
| **N-09** | **CORRIGIDO** | `main.ts` passou a usar `app.enableCors({ origin: configService.corsOrigin })`. |

### O que continua aberto

Sem mudança, por estarem fora do escopo desta rodada — todos entram no briefing do cliente:
P2-06 (valor divergente em NFM reaproveitada), P3-04 (rota manual síncrona), cenário 15 (nota
reconciliada tarde gera boleto com vencimento no passado), R6 (webhook/pagamento), RR5 (lote de 50),
`keepAlive` dos agents, purga de `nfse_attempts`.

### Para virar GO COM RESSALVAS

1. Rotacionar o A1 junto à AC, **revogar o antigo** e purgar o histórico (`docs/runbook-certificados.md` §4).
2. Preencher o `.env.production` do host de homologação a partir do `.env.example`, com SMTP real e
   `INTER_PROVIDER_ENABLED=true` apontando para o sandbox.
3. Conferir, com o ambiente de pé: `GET /admin/health/certificates`, `GET /admin/health/smtp` e
   `SELECT indexdef FROM pg_indexes WHERE indexname = 'nfses_one_active_per_nfm'`.
4. Confirmar com o frontend que o aviso do P0-06 e o botão de reemitir em `FAILED` estão na tela.
5. Renovar o mTLS sandbox do Inter antes de 2026-09-25 — agora a troca vale sem reiniciar.
