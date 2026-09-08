# Integração frontend — NFM (geradas + elegíveis + emissão NFS-e)

## Introdução

Este documento cobre as rotas admin de **NFM**:
- `GET /admin/nfm` — NFMs persistidas com NFS-e vinculada (filtro por período)
- `GET /admin/nfm/elegible` — clientes/grupos elegíveis para emissão
- `GET /admin/nfm/:id` — detalhe de uma NFM gerada (com NFS-e vinculada)
- `POST /admin/nfm` — salva NFMs e dispara emissão de NFS-e (1:1)
- `POST /admin/nfm/:id/cancel` — cancela a NFS-e vinculada à NFM (síncrono, Giss)
- `GET /admin/nfm/:id/provider-status` — consulta o Giss pelo RPS desta NFM (somente leitura)
- `POST /admin/nfm/:id/reconcile` — corrige o estado local com o que o Giss responder
- `POST /admin/nfm/:id/reissue` — reenvia o RPS depois de corrigir o cadastro
- `POST /admin/nfm/reconcile-period` — confere um período inteiro contra o Giss

E duas rotas de operação, fora do prefixo `/admin/nfm`:
- `GET /admin/metrics/nfse` — números do fluxo (status, presas, cobranças, filas)
- `GET /admin/health/certificates` — validade dos certificados digitais

**Referência OpenAPI:** Swagger em `/swagger`, tags **NFM** e **Manutenção**.

Config fiscal da empresa: [frontend-integracao-company-nfs-config.md](./frontend-integracao-company-nfs-config.md).  
ItemListaServico (LC 116) na correspondência CNAE/NBS/INDOP: [frontend-integracao-cnae-nbs-indop.md](./frontend-integracao-cnae-nbs-indop.md).

## Base URL

| Recurso | Prefixo | Autenticação |
|---------|---------|--------------|
| NFM | `/admin/nfm` | Admin (mesmo padrão das demais rotas NFM) |

---

## Resumo das mudanças (breaking)

| Antes | Depois |
|-------|--------|
| `GET /admin/nfm` → elegíveis (`NfmDto[]`) | `GET /admin/nfm` → NFMs geradas (paginado, `NfmWithNfseDto`) |
| — | `GET /admin/nfm/elegible` → elegíveis (`NfmDto[]`, contrato antigo) |
| — | `GET /admin/nfm/:id` → detalhe (`NfmWithNfseDto`) — **aditivo** |
| `POST /admin/nfm` | Sem mudança |
| `POST /admin/nfse` (emissão avulsa, claim `NFSE_WRITE`) | **Removido.** Emissão só via `POST /admin/nfm` (e demais módulos) |
| `GET /admin/nfse/:id` (claim `NFSE_READ`) | **Removido.** Detalhe da NFS-e vem em `GET /admin/nfm/:id` (`nfse`) |
| `POST /admin/nfse/:id/cancel` (`:id` = NFS-e, claim `NFSE_WRITE`) | `POST /admin/nfm/:id/cancel` (`:id` = **NFM**, claim `NFM_WRITE`) — **breaking** |
| `GET /admin/nfm/invoices` | **Removido.** Consulta de NFS-e no Giss saiu da API. Listar notas via `GET /admin/nfm`. |

### Mudanças aditivas (não breaking)

| O quê | Onde |
|-------|------|
| Novo valor `AWAITING_PROVIDER` em `nfse.status` | `GET /admin/nfm`, `GET /admin/nfm/:id` — ver [Status da NFS-e](#status-da-nfs-e-nfsestatus) |
| Novo valor `REJECTED` em `nfse.status` | idem — separa rejeição do fisco de falha de infraestrutura |
| Quatro rotas novas: `provider-status`, `reconcile`, `reissue`, `reconcile-period` | ver [Ferramentas de conserto](#ferramentas-de-conserto) |
| Novos campos `bankPaymentCanceled` e `bankPaymentError` na resposta | `POST /admin/nfm/:id/cancel` |
| Novos campos em `nfse`: `bankPaymentErrorMessage`, `bankPaymentFailedAt`, `bankPaymentRequestedAt`, `bankPaymentIdempotencyKey`, `nfmId` | `GET /admin/nfm`, `GET /admin/nfm/:id` |
| Novos campos em `nfse`: `bankPaymentStatus`, `bankPaymentConfirmedAt`, `reconcileAttemptCount`, `nextReconcileAt` | idem |
| Novos campos em `nfse`: `providerAlerts`, `providerAlertedAt` — ressalvas do fisco numa nota **emitida** | idem |
| Novos filtros em `GET /admin/nfm`: `status`, `stuckForHours`, `missingBankPayment` | ver [Listar NFMs geradas](#listar-nfms-geradas-get-adminnfm) |
| Duas rotas novas de operação: `GET /admin/metrics/nfse` e `GET /admin/health/certificates` | ver [Operação](#operação-métricas-e-certificados) |
| **A emissão passou a acontecer sozinha, todo dia às 06:00 (America/Sao_Paulo)** | ver [Emissão automática](#emissão-automática) |

### Fluxo sugerido na UI

1. **Tela lista** — `GET /admin/nfm?dateStart&dateEnd` exibe NFMs com NFS-e vinculada no intervalo.
2. Clique no item → `GET /admin/nfm/:id` para tela/detalhe.
3. Se NFS-e `ISSUED` → botão cancelar → `POST /admin/nfm/:id/cancel` com `cancelReasonCode`.
3.1. Se NFS-e `REJECTED` → botão reemitir → `POST /admin/nfm/:id/reissue`.
3.2. Se NFS-e `AWAITING_PROVIDER` → botões verificar/consultar; o backend já persegue sozinho.
4. Botão **Gerar NFMs** → abre tela de elegíveis.
5. **Tela elegíveis** — `GET /admin/nfm/elegible`; botão confirmar → `POST /admin/nfm`.

### Emissão automática

O fechamento deixou de depender de alguém apertar o botão: um agendamento diário às **06:00**
(America/Sao_Paulo) roda o mesmo `SaveElegibleNfms` do `POST /admin/nfm`.

O que muda para a UI:

- **A elegibilidade agora é `dueDateDay <= hoje` dentro do mês corrente**, não mais igualdade com o
  dia. `GET /admin/nfm/elegible` usa a mesma regra, então a tela mostra exatamente o que o
  agendamento vai emitir — inclusive contratos de dias já passados que ninguém faturou.
- **NFM atrasada nasce com a data de hoje**: competência do mês corrente, e o vencimento do boleto
  nunca no passado (um contrato de vencimento 15 faturado no dia 20 gera boleto para o dia 20).
- `POST /admin/nfm` continua existindo e continua idempotente por competência — é o caminho de
  exceção, para quando a operação quiser antecipar ou refazer o fechamento. Rodá-lo depois do
  agendamento não duplica nada: as NFMs do dia voltam como `skipped`.
- Quando o fechamento automático termina com falhas, a operação recebe e-mail com os clientes que
  falharam. A tela não precisa fazer nada, mas convém não estranhar NFMs que apareceram sozinhas.

---

## Listar NFMs geradas (`GET /admin/nfm`)

Retorna apenas NFMs com `nfseId` preenchido (já dispararam emissão no Giss).  
Filtro de data usa `createdAt` da NFM (UTC, dias inclusivos).

### Query

| Campo | Obrigatório | Tipo | Observação |
|-------|-------------|------|------------|
| `dateStart` | não | string `YYYY-MM-DD` | `createdAt >= início do dia` |
| `dateEnd` | não | string `YYYY-MM-DD` | `createdAt <= fim do dia` |
| `status` | não | `NfseStatus` | Status da NFS-e vinculada (`PENDING`, `SUBMITTED`, `PROCESSING`, `AWAITING_PROVIDER`, `ISSUED`, `REJECTED`, `FAILED`, `CANCELED`) |
| `stuckForHours` | não | number > 0 | Só o que está **preso**: NFS-e não terminal sem movimento há mais de N horas |
| `missingBankPayment` | não | boolean | `true` = emitidas sem cobrança vinculada; `false` = só as que já têm cobrança |
| `page` | não | number | Paginação |
| `size` | não | number | Paginação |

`dateStart` e `dateEnd` são **independentes**. Se ambos e `dateStart > dateEnd` → **400**.

Os três filtros novos combinam entre si e com o período. São eles que substituem o SQL manual do
runbook: `?status=AWAITING_PROVIDER` lista o que o backend ainda persegue,
`?stuckForHours=2` lista o que parou de andar, e `?missingBankPayment=true` lista nota emitida com
cliente sem boleto. `totalItems` passou a contar exatamente as linhas que a página devolve.

### Response (200)

Paginação (`data`, `totalItems`, `itemsPerPage`, `totalPages`, `currentPage`).

Cada item em `data` é `NfmWithNfseDto`:
- `id`, `clientId`, `clientDocument`, `companyName`, `status`
- `referenceMonth`, `referenceYear`, `totalValueInCents`, `cnaeNbsIndopId`
- `createdAt`, `updatedAt`
- `nfse` — objeto `NfseDto` completo (`nfseNumber`, `status`, `issuedAt`, `bankPaymentProvider`, `bankPaymentRequestCode`, etc.)

**Nota:** `nfse.issuedAt` pode ser `null` enquanto a fila Giss processa. A presença de `nfse` já indica que a emissão foi enfileirada.

**Campos aditivos em `nfse` (boleto Inter):**
- `bankPaymentProvider` — provedor do boleto (ex.: `INTER`); `null` enquanto a emissão do boleto não concluiu
- `bankPaymentRequestCode` — código da cobrança no Inter; `null` enquanto a fila/Inter estiver pendente
- `bankPaymentErrorMessage` / `bankPaymentFailedAt` — motivo e momento da última falha de emissão do
  boleto. Antes essas falhas eram silenciosas: a nota ficava `ISSUED` sem cobrança e sem explicação.
  Com `bankPaymentErrorMessage` preenchido **e** `bankPaymentRequestCode` nulo, a UI deve mostrar o
  motivo junto do botão de gerar boleto (`POST /admin/bank-payment/nfm/:id`)
- `bankPaymentRequestedAt` / `bankPaymentIdempotencyKey` — marca de que uma tentativa já chegou ao
  provedor. Uso interno (a partir dela o backend consulta o Inter antes de reemitir); a UI não
  precisa exibir
- `nfmId` — a NFM de origem; redundante com o vínculo que a própria resposta já traz
- `bankPaymentStatus` / `bankPaymentConfirmedAt` — situação da cobrança **confirmada junto ao Inter**.
  Receber `bankPaymentRequestCode` só diz que a solicitação foi aceita; a produção do boleto é
  assíncrona e pode falhar. Com `bankPaymentStatus === 'FAILED'`, o cliente **não** recebeu boleto,
  ainda que a NFS-e pareça saudável. `bankPaymentConfirmedAt` nulo com código preenchido significa
  "ainda confirmando" — a UI pode mostrar isso como pendente, não como erro
- `reconcileAttemptCount` / `nextReconcileAt` — quantas vezes o backend já perguntou ao Giss sobre
  esta nota e quando pergunta de novo. Uso interno; útil só numa tela de diagnóstico
- `providerAlerts` / `providerAlertedAt` — **ressalvas do fisco numa nota que foi emitida**. Códigos
  `A*` do Giss (`A10` inscrição municipal paralisada, `A13` prazo de conversão do RPS vencido, `A21`
  Simples fora do cadastro) chegam junto com a emissão e exigem regularização junto à Prefeitura. A
  nota é válida: mostre como aviso, nunca como erro. `providerAlertedAt` só diz que a operação já
  recebeu o e-mail sobre ela

Não há endpoint novo para esses campos: eles vêm em `GET /admin/nfm` e `GET /admin/nfm/:id` dentro de
`nfse`. Não é breaking.

### Erros

| Status | Quando |
|--------|--------|
| 400 | Formato de data inválido ou `dateStart > dateEnd` |

---

## Status da NFS-e (`nfse.status`)

Vale para `GET /admin/nfm`, `GET /admin/nfm/:id` e para o `status` devolvido pelo cancelamento.

| Valor | Significado | Terminal? | O que a UI faz |
|-------|-------------|-----------|----------------|
| `PENDING` | Criada localmente, ainda não enviada ao Giss | não | "Aguardando envio" |
| `SUBMITTED` | Lote aceito pelo Giss, com protocolo; aguardando processamento | não | "Em processamento" |
| `PROCESSING` | Consulta do lote em andamento (reagendada em backoff) | não | "Em processamento" |
| `AWAITING_PROVIDER` | **Novo.** Não se sabe se o Giss emitiu a nota | não | Ver abaixo — **não** tratar como erro |
| `ISSUED` | Emitida. `nfseNumber`, `verificationCode` e `issuedAt` preenchidos | sim | Habilita cancelar |
| `REJECTED` | **Novo.** O fisco recusou o conteúdo do RPS (cadastro do tomador, item de serviço, alíquota). A nota **não** existe do outro lado | sim | Mostrar `errorMessage` e habilitar **reemitir** |
| `FAILED` | Erro determinístico de infraestrutura ou de configuração (certificado, `municipioSlug` ausente). A nota **não** chegou ao provedor | sim | Mostrar `errorMessage` e habilitar **reemitir**, depois de a configuração ser corrigida |
| `CANCELED` | Cancelada. `canceledAt` e `cancelReasonCode` preenchidos | sim | — |

### `REJECTED` — o status novo desta entrega

Status **aditivo**. Antes, rejeição do fisco e falha de certificado eram o mesmo `FAILED`, e as duas
exigem ações opostas: uma se resolve corrigindo o cadastro do cliente e reemitindo, a outra
corrigindo a configuração da empresa. Uma tela que trate qualquer coisa fora de `ISSUED` como
"problema" não quebra, mas perde a distinção que decide o que fazer.

Regras de UI:

- Mostrar `errorMessage` — é a mensagem do fisco, com o código (`E163`, `E202`…).
- Habilitar o botão **Reemitir** (`POST /admin/nfm/:id/reissue`), que exige motivo e confirmação.
- `FAILED` **também** oferece reemitir, mas o texto de apoio muda: em `REJECTED` o operador corrige o
  cadastro do cliente, em `FAILED` corrige a configuração da empresa (caminho ou senha do
  certificado, `municipioSlug`, código de tributação municipal). Reemitir antes de corrigir devolve o
  mesmo erro.

### `AWAITING_PROVIDER` — não é erro

Significa: a requisição ao Giss terminou de forma ambígua — timeout, erro de rede, TLS, 5xx, ou o
próprio Giss respondendo que **já conhece aquele RPS**. A nota provavelmente foi emitida, e só uma
consulta ao provedor pode confirmar. Antes, esses casos viravam `FAILED`, o que fazia a operação
parar de procurar por uma nota que existia.

O motivo exato vem em `nfse.errorMessage`.

Regras de UI:

- **Não** é erro. Não usar cor/ícone de falha — usar estado de atenção ("aguardando confirmação do
  provedor").
- **Não** oferecer botão de reemitir às cegas. A reemissão às cegas duplica a nota fiscal — e a rota
  de reemissão recusa (`409`) quando descobre a nota no provedor.
- **O backend agora resolve esse estado sozinho**: uma varredura consulta o Giss pela chave natural
  do RPS em intervalos crescentes (5min → 15min → 1h → 6h → 24h → diário). A UI pode oferecer
  "Verificar agora" (`POST /admin/nfm/:id/reconcile`) para antecipar, e "Consultar no provedor"
  (`GET /admin/nfm/:id/provider-status`) para ver a resposta bruta sem alterar nada.
- Não habilitar cancelamento (só `ISSUED` cancela).

O backend também alerta por e-mail quando há notas nesse estado, então a UI não precisa notificar.

---

## Ferramentas de conserto

Quatro rotas administrativas para quando algo trava. Todas exigem role Admin.

| Rota | Claim | Corpo | Resposta | Quando usar |
|------|-------|-------|----------|-------------|
| `GET /admin/nfm/:id/provider-status` | `NFM_READ` | — | `200 { nfseId, rpsNumber, rpsSeries, found, note?, errors?, consultedAt }` | Ver o que o Giss sabe sobre o RPS. **Não altera nada.** |
| `POST /admin/nfm/:id/reconcile` | `NFM_WRITE` | `{ reason }` | `200 { nfseId, previousStatus, newStatus, source }` | Corrigir o estado local com o que o Giss responder — inclusive tirar de `FAILED`/`AWAITING_PROVIDER` para `ISSUED`. |
| `POST /admin/nfm/:id/reissue` | `NFM_WRITE` | `{ reason, confirm: true }` | `202 { nfseId, rpsNumber, rpsSeries, status }` | Reenviar depois de corrigir o cadastro. Reaproveita o **mesmo** RPS. |
| `POST /admin/nfm/reconcile-period` | `NFM_WRITE` | `{ startDate, endDate, dryRun? }` | `200 { checked, corrected, pagesRead, divergences[], dryRun }` | Conferir um período inteiro. `dryRun` é **true** por padrão. |

### Reemitir — o que a rota faz antes de reenviar

A rota **consulta o Giss ela mesma**. Não basta o operador ter consultado antes: quem decide é a
resposta do provedor no momento da chamada.

| Situação | Resposta |
|----------|----------|
| Status ∉ `{REJECTED, AWAITING_PROVIDER, FAILED}` | `409` — `ISSUED`, `CANCELED` e os estados em andamento (`PENDING`, `SUBMITTED`, `PROCESSING`) não se reemitem |
| O Giss já tem a nota | `409` — o estado local é corrigido para `ISSUED` e **nada** é reenviado |
| O lote ainda está em processamento | `409` — a consulta do lote foi reagendada |
| A consulta não foi conclusiva (erro sobre a própria consulta, não sobre a nota) | `409` — resolver o motivo antes; reenviar sem resposta é apostar contra uma nota que pode existir |
| O Giss confirma que não existe NFS-e para o RPS | `202` — a nota volta a `PENDING` com o mesmo RPS e entra na fila |

`reason` é obrigatório (mínimo 5 caracteres) e `confirm` tem de ser exatamente `true`: reemitir
produz documento fiscal.

### Conciliação por período

Roda automaticamente todo dia às 07:30 (D-1). A rota manual serve para conferir uma janela
específica. `divergences[]` lista as notas locais não terminais do período e diz, para cada uma, se
o provedor a tem (`foundAtProvider`). Notas do provedor sem par local são ignoradas — a consulta
devolve tudo que o prestador emitiu, inclusive pelo portal e pela contabilidade.

---

## Buscar NFM por ID (`GET /admin/nfm/:id`)

**Aditivo** (sem breaking). Mesmo shape de item da lista: `NfmWithNfseDto`.

Claim: `NFM_READ` (igual às demais leituras NFM).

### Path

| Campo | Tipo | Observação |
|-------|------|------------|
| `id` | number (inteiro positivo) | ID da NFM |

### Response (200)

`NfmWithNfseDto`:
- `id`, `clientId`, `clientDocument`, `companyName`
- `referenceMonth`, `referenceYear`, `totalValueInCents`, `cnaeNbsIndopId`
- `createdAt`, `updatedAt`
- `nfse` — objeto `NfseDto` completo

### Erros

| Status | Quando |
|--------|--------|
| 400 | `id` inválido (não numérico / não positivo) |
| 404 | NFM não encontrada |

---

## Listar elegíveis (`GET /admin/nfm/elegible`)

Mesmo contrato que o antigo `GET /admin/nfm`.

Retorna **um item por grupo fiscal** `(cliente + cnaeNbsIndop)`, não um por cliente.

Se o cliente tem itens com 2 tributações diferentes → **2** objetos no array (mesmo `client`, `clientItems` só do grupo).

### Response (200)

Array de `NfmDto`:
- `client` — inclui `company: { id, name }`
- `clientInvoiceConfig` — inclui `issWithheld: boolean`
- `clientItems[]` — itens do **mesmo** `cnaeNbsIndop`; cada item traz `cnaeNbsIndop` completo (incl. `serviceListItemCode`)

---

## Cancelar NFS-e da NFM (`POST /admin/nfm/:id/cancel`)

**Breaking:** a rota antiga `POST /admin/nfse/:id/cancel` foi removida.  
Use o **id da NFM** (o mesmo de `GET /admin/nfm` / `GET /admin/nfm/:id`), não o id da NFS-e.

Claim: `NFM_WRITE`.

Chamada **síncrona** ao Giss Online. Só funciona se a NFS-e vinculada estiver `ISSUED`.

### Path

| Campo | Tipo | Observação |
|-------|------|------------|
| `id` | number (inteiro positivo) | ID da **NFM** |

### Body

| Campo | Obrigatório | Tipo | Valores |
|-------|-------------|------|---------|
| `cancelReasonCode` | sim | number | `1` (erro na emissão), `2` (serviço não prestado), `4` (duplicidade). Códigos `3` e `5` são rejeitados (restritos à Administração Tributária). |

Exemplo:

```json
{ "cancelReasonCode": 2 }
```

### Cancelamento em cascata do boleto

Cancelar a NFM passou a cancelar **também** a cobrança bancária vinculada, quando ela existe
(`nfse.bankPaymentRequestCode` preenchido). O boleto é cancelado antes da nota, porque reemitir uma
cobrança é reversível e cancelar uma NFS-e não é.

A falha no cancelamento do boleto **não** aborta o cancelamento da nota: a rota conclui com 200, a
NFS-e fica `CANCELED` e a pendência do boleto volta na resposta. É intencional — travar o
cancelamento fiscal por causa da cobrança deixaria a operação sem saída.

### Response (200)

```json
{
  "id": 42,
  "status": "CANCELED",
  "canceledAt": "2026-07-29T12:00:00.000Z",
  "bankPaymentCanceled": true
}
```

Quando havia boleto e o cancelamento dele falhou:

```json
{
  "id": 42,
  "status": "CANCELED",
  "canceledAt": "2026-07-29T12:00:00.000Z",
  "bankPaymentCanceled": false,
  "bankPaymentError": "Falha na comunicação com a API de cobrança do Banco Inter."
}
```

| Campo | Significado |
|-------|-------------|
| `id` | ID da **NFM** (igual ao path) |
| `status` | Status da NFS-e após o cancelamento (`CANCELED`) |
| `canceledAt` | Data/hora confirmada pelo provedor |
| `bankPaymentCanceled` | **Aditivo.** `true` só quando havia boleto vinculado e ele foi cancelado. `false` tanto quando não havia boleto quanto quando o cancelamento falhou — use `bankPaymentError` para distinguir |
| `bankPaymentError` | **Aditivo, opcional.** Presente **apenas** quando havia boleto e o cancelamento falhou. Exige tratamento manual: a cobrança continua viva e cobrável |

**Na UI:** com `bankPaymentError` presente, mostrar aviso persistente (não toast) indicando que a
NFS-e foi cancelada mas a cobrança **não**, e que ela precisa ser cancelada manualmente pelo
provedor. `bankPaymentCanceled: false` sem `bankPaymentError` é o caso normal de nota sem boleto —
não mostrar nada.

### Erros

| Status | Quando |
|--------|--------|
| 400 | `id` inválido; `cancelReasonCode` inválido; NFS-e não emitida / já cancelada |
| 404 | NFM não encontrada |
| 503 | Giss / provedor indisponível |

Após sucesso, recarregar o detalhe com `GET /admin/nfm/:id` — `nfse.status` deve ser `CANCELED`.

---

## Salvar elegíveis e emitir (`POST /admin/nfm`)

Sem body. Para cada grupo elegível do mês corrente:
1. Persiste NFM (se ainda não existir)
2. Chama emissão NFS-e (`IssueNfse`) — fila GISS assíncrona
3. Vincula `nfseId` (relação 1:1)

Reexecução no mesmo mês:
- Já tem `nfseId` → **skip**
- Existe NFM sem `nfseId` (falha anterior) → **retry** da emissão

### Response (201)

```json
{
  "created": 2,
  "skipped": 1,
  "failed": 1,
  "errors": [
    {
      "clientId": 10,
      "cnaeNbsIndopId": 3,
      "message": "Correspondência CNAE/NBS/INDOP 3 sem ItemListaServico (LC 116)."
    }
  ]
}
```

| Campo | Significado |
|-------|-------------|
| `created` | Vinculou `nfseId` nesta execução |
| `skipped` | Já tinha NFS-e |
| `failed` | Erro (NFM fica sem `nfseId`, status `FAILED`) |
| `errors[]` | Detalhe por grupo que falhou |

HTTP **não** espera a GISS. Só persistência + enqueue.

### Falhas comuns em `errors[].message`

- Sem `serviceListItemCode` na correspondência CNAE/NBS/INDOP
- Sem alíquota ISS / config NFS-e da empresa
- Sem código de tributação municipal (`municipalTaxCode`) na config NFS-e da empresa
- Cliente sem endereço BILLING/MAIN com `cityCodeIbge`

---

## Operação (métricas e certificados)

Duas rotas de leitura pura, fora do prefixo `/admin/nfm`. Servem a uma tela de diagnóstico; nenhuma
delas é necessária no fluxo normal de emissão.

### `GET /admin/metrics/nfse` — números do fluxo

Claim `NFM_READ`. Resposta (`GetNfseMetricsOutputDto`):

| Campo | O que é |
|---|---|
| `generatedAt` | Instante da coleta (ISO) |
| `byStatus[]` | `{ key, count }` — NFS-e por status |
| `stuck` | Não terminais sem movimento há mais de 2h |
| `issuedWithoutBankPayment` | Emitidas sem cobrança há mais de 1h |
| `bankPaymentByStatus[]` | Cobranças por situação confirmada; `UNCONFIRMED` = solicitada e ainda não confirmada |
| `providerCalls[]` | `{ operation, calls, errors, averageDurationMs, maxDurationMs }` nas últimas 24h |
| `queues[]` | `{ queue, waiting, active, delayed, failed }` — `failed` é a fila de jobs que desistiram |

Os limiares de `stuck` (2h) e `issuedWithoutBankPayment` (1h) são os mesmos dos alertas por e-mail:
o número da tela e o do e-mail nunca discordam.

### `GET /admin/health/certificates` — validade dos certificados

Claim `COMPANY_NFS_CONFIG_READ`. Uma linha por certificado (A1 do Giss por empresa, mTLS do Inter),
com `notAfter`, `daysToExpire` e `status` (`OK` / `EXPIRING` / `EXPIRED` / `ERROR`); o `status` do
topo é o pior deles. `EXPIRING` significa 30 dias ou menos — prazo apertado para emitir um
certificado novo junto à AC. Detalhes e procedimento de troca em
[`runbook-certificados.md`](./runbook-certificados.md).

---

## Autenticação e claims

| Rota | Claim |
|------|-------|
| `GET /admin/nfm`, `GET /admin/nfm/elegible`, `GET /admin/nfm/:id` | `NFM_READ` |
| `GET /admin/nfm/:id/provider-status` | `NFM_READ` |
| `POST /admin/nfm`, `POST /admin/nfm/:id/cancel` | `NFM_WRITE` |
| `POST /admin/nfm/:id/reconcile`, `POST /admin/nfm/:id/reissue`, `POST /admin/nfm/reconcile-period` | `NFM_WRITE` |
| `GET /admin/metrics/nfse` | `NFM_READ` |
| `GET /admin/health/certificates` | `COMPANY_NFS_CONFIG_READ` |

---

## Checklist frontend

1. **Breaking:** migrar tela de elegíveis de `GET /admin/nfm` → `GET /admin/nfm/elegible`.
2. Nova tela lista: `GET /admin/nfm?dateStart&dateEnd&page&size` — resposta **paginada** (`data[]` de `NfmWithNfseDto`).
3. Detalhe: `GET /admin/nfm/:id` — mesmo `NfmWithNfseDto`; tratar **404**.
4. **Breaking:** parar `POST /admin/nfse`, `GET /admin/nfse/:id` e `POST /admin/nfse/:id/cancel`. Claims `NFSE_READ` / `NFSE_WRITE` saíram. Emissão via `POST /admin/nfm`; detalhe via `GET /admin/nfm/:id`; cancelamento via `POST /admin/nfm/:id/cancel` (id da **NFM**, claim `NFM_WRITE`).
5. Cancelar só quando `nfse.status === 'ISSUED'`; body `{ cancelReasonCode: 1 | 2 | 4 }`; após 200, refrescar detalhe.
5.1. **Aditivo:** tratar `AWAITING_PROVIDER` em `nfse.status` — estado de atenção, não de erro; sem botão de reemitir às cegas; sem botão de cancelar. Ver [Status da NFS-e](#status-da-nfs-e-nfsestatus).
5.3. **Aditivo:** tratar `REJECTED` em `nfse.status` — mostrar `errorMessage` e habilitar **Reemitir** (`POST /admin/nfm/:id/reissue`, body `{ reason, confirm: true }`, respostas `202` ou `409`). `FAILED` continua sem reemitir: é problema de configuração, não de cadastro.
5.4. **Aditivo:** em `AWAITING_PROVIDER`, oferecer "Verificar agora" (`POST /admin/nfm/:id/reconcile`) e "Consultar no provedor" (`GET /admin/nfm/:id/provider-status`). Ver [Ferramentas de conserto](#ferramentas-de-conserto).
5.5. **Aditivo:** ler `nfse.bankPaymentStatus`. Com `FAILED`, avisar que o cliente não recebeu boleto mesmo com a NFS-e emitida e vinculada.
5.2. **Aditivo:** na resposta do cancelamento, ler `bankPaymentCanceled` e `bankPaymentError`. Com `bankPaymentError` presente, avisar de forma persistente que a cobrança **não** foi cancelada e precisa de tratamento manual.
6. Botão gerar → tela elegíveis → confirmar com `POST /admin/nfm`.
7. `POST /admin/nfm`: exibir resumo `created` / `skipped` / `failed` + lista de `errors`.
8. Garantir cadastro fiscal antes de emitir: LC 116 na correspondência, ISS/Simples/`municipalTaxCode` na config da empresa, `issWithheld` no invoice config do cliente.
9. **Breaking:** `GET /admin/nfm/invoices` saiu. Parar de chamar a rota; regenerar tipos OpenAPI.
10. Atualizar mocks/tipos E2E (`GET /admin/nfm/:id`, `POST /admin/nfm/:id/cancel`).
11. **Aditivo:** usar os filtros novos de `GET /admin/nfm` (`status`, `stuckForHours`,
    `missingBankPayment`) numa visão "o que precisa de atenção" — hoje isso só existia como SQL.
12. **Aditivo:** exibir `nfse.providerAlerts` como **aviso** na nota emitida (ressalva do fisco, exige
    regularização junto à Prefeitura), nunca como erro.
13. **Aditivo:** a emissão passou a ser automática às 06:00; a tela de elegíveis agora mostra também
    contratos de dias já passados no mês (`dueDateDay <= hoje`). Rodar `POST /admin/nfm` continua
    seguro — o que já foi emitido volta como `skipped`.
