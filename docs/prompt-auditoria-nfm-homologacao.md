# Prompt — auditoria de fechamento NFM (pré-homologação)

> Copie o bloco abaixo e cole num chat novo (Agent). O documento de origem é
> `docs/auditoria-nfm-resiliencia.md`. Este prompt **não** pede implementação:
> pede veredito GO / GO COM RESSALVAS / NO-GO para testar com o cliente em homologação.

---

```
Você é um auditor sênior de resiliência (backend NestJS + Prisma + BullMQ + GISS + Banco Inter).

MISSÃO
Auditar o código ATUAL do repositório contra `docs/auditoria-nfm-resiliencia.md` e responder, com evidência:
1. Cada ponto falho da auditoria foi de fato corrigido no código (não só marcado ✅ no markdown)?
2. O fluxo NFM (NFS-e + boleto) está pronto para teste em homologação COM O CLIENTE?
3. O que ainda quebra, o que foi adiado de propósito, e o que o cliente NÃO deve testar nesta rodada.

NÃO implemente. NÃO refatore. NÃO abra PR. Só leia, rode testes que já existem, e emita o relatório.

FONTE DE VERDADE
- Código e schema atuais vencem o markdown. O documento foi escrito em 2026-09-01 sobre `fix/nfm-flow` @ `84d5fd36` e atualizado até 2026-09-04. Trechos citados lá (`arquivo:linha`) provavelmente mudaram. Sempre reabra o arquivo.
- "Status: ✅ resolvido na Onda X" no documento é HIPÓTESE. Prove ou refute no código.
- Decisões da operação (adiados / fora de escopo / desvios da correção proposta) NÃO são bugs — classifique como "adiado por decisão" e julgue se bloqueiam homologação.
- Skills do projeto: `.cursor/skills/architecture-overview`, `queue-bullmq`, `gateway-adapters`, `error-handling`, `testing-strategy`. Arquitetura hexagonal (drivers/driven). Não proponha CQRS, domain events nem MediatR.

ESCOPO
Inclua:
  src/app/tax-invoice/nfm
  src/app/tax-invoice/nfse
  src/app/bank-payment
  src/infra/nfs-generation
  src/infra/bank-payment
  src/infra/queue
  src/infra/alert (e equivalentes de SMTP/alerta)
  prisma/schema (nfm, nfse, bank-payment)
  prisma/migrations relacionadas às ondas
  .env.example, .env.development, .env.production, .env.test
  docker-compose.yml
  docs/runbook-certificados.md
  docs/frontend-integracao-nfm.md
  src/app/tax-invoice/nfse/nfse-flow.e2e.integration.spec.ts (e specs do fluxo)

Não alargue para o resto do produto, salvo se um achado vazar (ex.: AuditInterceptor, certificados no git, tokens DI).

REGRAS DE EVIDÊNCIA
- Toda afirmação cita `arquivo:linha` do código ATUAL.
- Classifique CADA achado P0/P1/P2/P3 e CADA cenário 1–16 em UM de:
  CORRIGIDO          — correção no código bate com o proposto (ou equivalente seguro)
  CORRIGIDO COM DESVIO — funciona, mas a operação entregou diferente do proposto; descreva o desvio e o risco residual
  PARCIAL            — metade feita; diga o que falta
  ADIADO             — fora de escopo por decisão explícita no §8; não é regressão
  ABERTO             — ainda quebra, ou o ✅ do doc é falso
  NÃO APLICÁVEL      — premissa mudou (ex.: fila `nfse` única não existe mais)
- Não confie em comentários, READMEs nem nomes de variável. Siga o caminho de execução.
- Se um teste e2e cobre o cenário, cite o `it(...)`. Se o teste mocka a falha de verdade, diga que NÃO prova o cenário.
- Rode `git log --oneline -30` e `git status` no começo. Informe branch e HEAD. Se o working tree estiver sujo, audite o que está no disco, não o último commit.

MÉTODO (nesta ordem)

Fase 0 — Calibrar
1. Leia o sumário (§1), a máquina de estados necessária (§2.4), os princípios (§5.1), o plano (§8) e a matriz (§4) de `docs/auditoria-nfm-resiliencia.md`.
2. Mapeie o fluxo ATUAL ponta a ponta (HTTP → use case → transação/outbox → filas → GISS → poll/reconciliação → Inter → confirmação). Desenhe os COMMITs e as chamadas externas como a §2.1, com arquivos atuais.
3. Liste filas (`QueueName` / `JobName`), crons (`@Cron`), rotas admin NFM/bank-payment/metrics/health, e estados reais de `Nfse.status`.

Fase 1 — Achados, um a um
Para cada item abaixo, abra o código do caminho de execução e julgue. Não pule item.

P0 — crítico (bloqueia homologação se ABERTO)
- P0-01 Segunda NFS-e se o processo morre entre criar NFS-e e vincular NFM.
  Esperado: `INfseRepository.reserve()` (ou equivalente) em `$transaction`: lock FOR UPDATE na NFM + getAndIncrement RPS + INSERT nfses + vínculo dos dois lados + outbox; job só depois do commit. Índice parcial `nfses_one_active_per_nfm`.
- P0-02 Boleto não idempotente (órfão <30 min, duplicado >30 min).
  Esperado: payload congelado (`dataVencimento`/`valorNominal` da 1ª tentativa, nunca `new Date()`/`DateTime.now()` no retry); chave/intenção gravada ANTES do POST; consulta prévia por `seuNumero` quando já houve tentativa (`bankPaymentRequestedAt`); recusa por duplicidade (HTTP 400, `detail` com `código de solicitação: <uuid>`) vira vínculo após GET de confirmação comparando seuNumero+valorNominal+dataVencimento; `extractInterErrorMessage` NÃO deixa `title` vencer `detail`.
- P0-03 Timeout/erro transitório no envio marca FAILED terminal sem consultar GISS.
  Esperado: erro ambíguo → `AWAITING_PROVIDER` (NÃO `SUBMIT_UNKNOWN` — decisão Onda 3), nunca FAILED; `E10`/`E71`/`A12` disparam `ConsultarNfsePorRps` e reconciliam; rejeição de negócio da recepção NÃO vira ExternalApiError genérico; mapper preserva TODAS as mensagens e o código.
- P0-04 Janela de poll de 5 min → FAILED com nota viva no GISS.
  Esperado: backoff longo; com protocolo e sem situação Error NUNCA marca FAILED; vira `AWAITING_PROVIDER` + reconciliação. `RecepcionarLoteRpsSincrono` está ADIADO — não cobre este item como "aberto".
- P0-05 HTTP sem timeout (GISS e Inter).
  Esperado: timeout configurado de verdade (HttpModule e/ou AbortSignal); `INTER_HTTP_TIMEOUT_MS` lido OU removido. Confira se o valor chega no axios, não só no .env.
- P0-06 Cancelar NFM não cancela boleto.
  ATENÇÃO — desvio documentado na Onda 1: "cancela a nota sempre e reporta a falha do boleto na resposta". A proposta original era boleto PRIMEIRO e abortar se o boleto falhar. Verifique o que o código faz HOJE. Se a NFS-e cancela e o boleto fica ativo, isso é risco financeiro em homologação (cliente paga nota cancelada). Classifique com honestidade.
- P0-07 Certificado A1 de produção no git.
  Esperado: nenhum `.pfx`/`.key`/`.crt` de produção no índice; caminhos via env; `docs/runbook-certificados.md` coerente. Rode `git ls-files '*.pfx' '*.key' '*.crt'` e busque PKCS#12 em `resources/`.

P1 — alto (quase sempre bloqueia homologação se ABERTO)
- P1-01 `removeOnFail: true` apaga job. Esperado: retenção (~30 dias), attempts>1 nos jobs de lote/poll, rastro no Bull Board.
- P1-02 PENDING/SUBMITTED/PROCESSING sem dono. Esperado: SweepNfseRecovery (outbox, reconciliação vencida, ISSUED sem boleto, cobrança não confirmada); toda NFS-e nasce com `nextReconcileAt`.
- P1-03 Falha de boleto engolida (`return null`). Esperado: PermanentProviderError + UnrecoverableError; motivo em `bankPaymentErrorMessage`; no-ops (`!isIssued`, `hasBankPayment`) continuam null.
- P1-04 Sem rota de reemissão. Esperado: `POST /admin/nfm/:id/reissue` consulta GISS ANTES, reusa o MESMO RPS, 409 se a nota existe ou o lote está processando; também reconcile, provider-status, reconcile-period.
- P1-05 Duas requests concorrentes → duas NFS-e. Esperado: FOR UPDATE + índice parcial; P2002 → skipped/erro de domínio, não segunda nota.
- P1-06 Só disparo manual no dia exato. Esperado: cron diário fail-closed (sem lock Redis = não emite); elegibilidade `dueDateDay <= hoje` no fuso America/Sao_Paulo; piso de vencimento do boleto (cenário 15).
- P1-07 Retry manual de boleto síncrono e duplicável. Esperado: herda consulta prévia via `bankPaymentRequestedAt` (não `job.attemptsMade`); lock por nfseId. Enfileirar 202 é desejável, não obrigatório se a idempotência local segura o duplo clique.
- P1-08 POST /cobrancas assíncrono nunca confirmado. Esperado: ConfirmNfseBankPayment + `bankPaymentStatus`/`bankPaymentConfirmedAt` + alerta FALHA_EMISSAO. Webhook `PUT /cobrancas/webhook` está ADIADO — confirme que a varredura cobre homologação. Declare explicitamente: o sistema AINDA NÃO SABE se o cliente pagou (R6).

P2 — médio (não bloqueia sozinho, acumula)
- P2-01 `isTerminal()` sem CANCELED; poll/job reentrega reenvia RPS. Esperado: `ensureMutable()` barra ISSUED e CANCELED; `canSubmitToProvider()` só PENDING sem protocolo; issuedNotes casados por rpsNumber+rpsSeries, nunca `[0]`.
- P2-02 RPS queimado fora da transação. Esperado: getAndIncrement DENTRO da transação de reserve(); rollback devolve o número.
- P2-03 Sem trilha GISS/Inter. Esperado: `nfse_attempts` escrita pelos adapters, never-throw. Dívida conhecida: sem purga (dados do tomador crescem sem limite) — ADIADO, registre no relatório.
- P2-04 Logs sem nfseId/correlationId. Onda 1 entregou nfseId SEM correlationId. Verifique se nfseId está em TODOS os logs do fluxo (issue, poll, boleto, reconcile, cancel). correlationId ausente = PARCIAL, não ABERTO crítico.
- P2-05 Auditoria só no HTTP de sucesso. Esperado: catchError ligado; RecordJobAudit com method JOB.
- P2-06 NFM reaproveitada com valor divergente (totalValueInCents congelado vs NFS-e recalculada). O documento NÃO marca este item como resolvido. Trate como suspeito até prova. Se ABERTO, diga impacto em relatório fiscal vs boleto.
- P2-07 429 como permanente. Esperado: Transient vs Permanent nos DOIS provedores; 400 do Inter NÃO é classe única (duplicidade vs validação); Retry-After reagenda job (DelayedError), não queima tentativa. Parser XML incompreensível NÃO é transitório.
- P2-08 Sem breaker / fila única serial. Esperado: filas `nfse-issue` / `nfse-poll` / `nfse-bank-payment` com concurrency+limiter; breaker por município no GissSoapClient; circuito aberto → TransientProviderError → AWAITING_PROVIDER. QueueName.Nfse legado NÃO deve existir.
- P2-09 Sem alerta e GET /admin/nfm cego. Esperado: AlertGateway SMTP + digest; filtros status/stuckForHours/missingBankPayment; GET /admin/metrics/nfse.
- P2-10 Certificado vence em silêncio. Esperado: notAfter nos dois loaders; GET /admin/health/certificates; alerta D-30/D-15/D-7. HOJE É 2026-09-08: o cert sandbox Inter vencia 2026-09-25 — confira validade ATUAL dos arquivos configurados. Homologação quebra se o mTLS do Inter estiver vencido ou ausente.
- P2-11 Alertas A* do GISS descartados. Esperado: ListaMensagemAlertaRetorno lida; providerAlerts persistido no markIssued; alerta uma vez; providerAlertedAt só DEPOIS do SMTP ok.
- P2-12 Alerta some se Redis/SMTP falham. Esperado: setIfAbsent relança se não consegue verificar; send() retorna boolean; janela só reivindicada/mantida após entrega; falha de trava ENVIA mesmo assim.

P3 — baixo
- P3-01 Sem e2e do fluxo. Esperado: nfse-flow.e2e.integration.spec.ts com Postgres+Redis, QUEUE_E2E=true. Confira se os 5 cenários citados ainda existem: feliz; crash commit/despacho; duas emissões simultâneas; timeout ambíguo + ConsultarNfsePorRps; recusa duplicidade Inter → vínculo.
- P3-02 PFX reparseado / Agent novo. PARCIAL documentado: cache mtime sim, keepAlive Agent NÃO. Confirme.
- P3-03 Env vars mortas (INTER_HTTP_TIMEOUT_MS, INVOICE_RETRY_DUE_DATE_DAYS). Sem status no doc. Prove se passaram a ser lidas ou se ainda mentem proteção.
- P3-04 Loop inteiro no HTTP (SaveElegibleNfms). Scheduler diário pode ter mudado o caminho feliz para job; a rota manual pode continuar síncrona. Diga o que o cliente dispara e se estoura timeout de proxy com centenas de elegíveis (R3).

Fase 2 — Matriz adversária (§4)
Reavalie os 16 cenários contra o código atual. Para cada um: comportamento HOJE, se o desejado foi atingido, achado ligado, bloqueia homologação? (sim/não/com ressalva).

Fase 3 — Contratos operacionais que o cliente vai tocar
Verifique existência, auth (role+claim), e proteções de §6:
- POST /admin/nfm (manual; agora exceção — o cron é o caminho feliz)
- GET /admin/nfm (filtros operacionais)
- POST /admin/nfm/:id/cancel (cascata)
- POST /admin/nfm/:id/reissue (confirm+reason; consulta GISS)
- POST /admin/nfm/:id/reconcile
- GET /admin/nfm/:id/provider-status
- POST /admin/nfm/reconcile-period (dryRun default?)
- POST /admin/bank-payment/nfm/:id
- POST /admin/bank-payment/:codigo/cancel
- GET /admin/metrics/nfse
- GET /admin/health/certificates
- GET /admin/audit-log?method=JOB
- Bull Board /admin/queues
Confira `docs/frontend-integracao-nfm.md` vs rotas reais. Divergência frontend/API é bloqueio de teste com cliente.

Fase 4 — Pronto para homologação (gate operacional)
Isto NÃO é "o código compila". É "dá para o cliente apertar o botão sem duplicar nota nem boleto".

Checklist (marque com evidência):
[ ] `npm test` — suíte unit/integration verde, ou liste falhas do fluxo NFM
[ ] `npm run test:e2e` (QUEUE_E2E=true) — os 5 cenários do fluxo
[ ] `npm run build` e `npm run lint` se o tempo permitir; senão declare que não rodou
[ ] Migrations: existe histórico prisma/migrations; ambientes de homolog PRECISAM de `migrate resolve --applied 0_init` se o banco já existia com db push (README). Confirme se a baseline e as migrations das ondas estão no repo.
[ ] Variáveis: GISS (URL/município, GISS_CERT_PATH, GISS_CERT_PASSWORD), Inter (API URL sandbox vs prod, INTER_CERT_PATH, INTER_KEY_PATH, client id/secret, timeout), SMTP_*, Redis, QUEUE_DASHBOARD_*, DATABASE_URL. Nenhuma proteção só no .env sem leitor no ConfigService.
[ ] Certificados de HOMOLOGAÇÃO existem FORA do git, válidos (notAfter > hoje+7d), e o healthcheck os enxerga. Inter produção ainda não emitido (RR1) — homologação usa sandbox; declare isso no veredito.
[ ] SMTP de homologação entrega de verdade (senão os alertas são teatro). Se não puder enviar, diga: operação fica cega.
[ ] Redis no docker-compose da homolog; filas sobem; Bull Board autenticado.
[ ] Workers drenam no SIGTERM (`enableShutdownHooks`).
[ ] Reconciliação D+1 e sweep de 5 min estão agendados em homolog (ScheduleModule NÃO silenciado).
[ ] Cron das 06:00 America/Sao_Paulo: em homolog o cliente pode precisar disparar na mão — a rota manual ainda é segura (lock + índice parcial)?
[ ] Um RPS por lote ainda (RR5 adiado). Cenário 14 permanece latente. Não teste lote de 50.
[ ] Não há webhook de pagamento. Teste de "cliente pagou o boleto" NÃO está no produto. Avise o cliente.
[ ] Cancelamento: roteiro do que acontece se o Inter recusar cancelar o boleto (desvio P0-06).
[ ] Segredo: nenhum cert/senha no repo; seeds não apontam para pfx versionado.

Fase 5 — O que o cliente PODE e NÃO DEVE testar nesta rodada
Liste explicitamente.

Pode (se GO/GO COM RESSALVAS):
- fechamento diário (cron ou POST manual) com dezenas de NFMs, não centenas na primeira vez
- caminho feliz até boleto vinculado e confirmado por GET
- cancelar NFM e conferir NFS-e + boleto nos dois provedores
- reemitir NFM REJECTED depois de corrigir cadastro (a rota consulta o GISS)
- simular GISS lento / timeout e ver AWAITING_PROVIDER + reconciliação, NÃO FAILED
- filtros GET /admin/nfm e e-mail de alerta (se SMTP ok)

Não deve / ainda não existe:
- webhook de baixa / conciliação de pagamento (R6, adiado)
- RecepcionarLoteRpsSincrono
- lote de 50 RPS
- certificado mTLS de produção do Inter
- forçar duas emissões manuais "pra ver se duplica" contra GISS REAL — o índice local protege, mas um teste mal desenhado no provedor custa ISS. Use o e2e com fakes para concorrência.
- SubstituirNfse / prazo >30 dias

FORA DE ESCOPO (não classifique como ABERTO)
- RecepcionarLoteRpsSincrono (Onda 3b)
- lote de 50 RPS (Onda 2 adiado)
- webhook Inter (Onda 4 adiado)
- stack Prometheus (métricas são JSON)
- rota POST /admin/queues/nfse/dlq (Bull Board substitui)
- correlationId (entregue só nfseId)
- purga de nfse_attempts
- https.Agent keepAlive (P3-02 resto)

VEREDITO — critérios duros

NO-GO se QUALQUER um:
- P0-01, P0-02, P0-03, P0-05, P0-07, P1-05 abertos (duplicidade fiscal/financeira ou cert no git)
- P0-06 ainda cancela a nota e deixa boleto cobrável SEM deixar isso explícito na API E no frontend
- e2e do fluxo vermelho ou inexistente
- cert Inter/GISS de homolog vencido ou path quebrado
- cron de emissão NÃO fail-closed (emite duplicado se Redis falhar)

GO COM RESSALVAS se:
- todos os P0 de duplicidade/timeout/cert estão CORRIGIDO ou CORRIGIDO COM DESVIO aceito
- P0-06 desvio está documentado no frontend e o operador vê a falha do boleto
- P2-06 / P3-03 / P3-04 / keepAlive / webhook / pagamento abertos, mas listados no briefing do cliente
- SMTP ou métricas frágeis, com plano B (SQL + Bull Board)

GO se:
- todos P0 e P1 CORRIGIDO (desvios só os já aceitos pela operação e sem risco financeiro residual)
- e2e verde
- gate operacional da Fase 4 completo
- briefing do cliente escrito (o que não testar)

FORMATO DO RELATÓRIO (obrigatório)

# Auditoria de fechamento NFM — pré-homologação
- Data, branch, HEAD, working tree limpo? sim/não
- Escopo efetivamente lido

## Veredito
Uma linha: GO | GO COM RESSALVAS | NO-GO
2–4 frases: por quê. O que o cliente pode fazer amanhã.

## Scorecard dos achados
Tabela: ID | Título | Classificação | Evidência (arquivo:linha) | Bloqueia homologação? | Risco residual

## Matriz §4
Tabela: cenário 1–16 | Atingiu o desejado? | Nota

## Desvios vs correção proposta
Cada desvio (começando por P0-06, P2-04 sem correlationId, AWAITING_PROVIDER no lugar de SUBMIT_UNKNOWN, cancelamento, métricas JSON). Risco residual.

## Adiados que o cliente vai sentir
Webhook/pagamento, síncrono GISS, lote 50, cert Inter prod.

## Gate operacional
Checklist da Fase 4, item a item, com passou/falhou/não verificado.

## Testes
O que rodou, o que passou, o que não cobriu (crash real, GISS real, Inter real).

## Briefing para o teste com o cliente
Roteiro curto: ordem dos testes, dados necessários (cliente com generateNf, dueDateDay, config GISS/Inter), o que observar (status, boleto, e-mail, Bull Board), o que NÃO fazer, critérios de aceite da rodada.

## Se NO-GO ou RESSALVAS
Lista priorizada do que falta ANTES da sessão com o cliente. Sem implementação neste chat.

ANTI-PADRÕES
- Não recicle o texto do markdown. Se o arquivo mudou de nome/linha, cite o atual.
- Não marque CORRIGIDO só porque existe um status novo no enum — siga o catch, o job, o índice.
- Não trate "adiado pela operação" como falha de engenharia.
- Não aprove homologação com "parece ok". Sem evidência = NÃO VERIFICADO, e NÃO VERIFICADO em P0 conta como NO-GO.
```
