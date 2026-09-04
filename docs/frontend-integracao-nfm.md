# Integração frontend — NFM (geradas + elegíveis + emissão NFS-e)

## Introdução

Este documento cobre as rotas admin de **NFM**:
- `GET /admin/nfm` — NFMs persistidas com NFS-e vinculada (filtro por período)
- `GET /admin/nfm/elegible` — clientes/grupos elegíveis para emissão
- `GET /admin/nfm/:id` — detalhe de uma NFM gerada (com NFS-e vinculada)
- `POST /admin/nfm` — salva NFMs e dispara emissão de NFS-e (1:1)
- `POST /admin/nfm/:id/cancel` — cancela a NFS-e vinculada à NFM (síncrono, Giss)

**Referência OpenAPI:** Swagger em `/swagger`, tag **NFM**.

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
| Novos campos `bankPaymentCanceled` e `bankPaymentError` na resposta | `POST /admin/nfm/:id/cancel` |
| Novos campos em `nfse`: `bankPaymentErrorMessage`, `bankPaymentFailedAt`, `bankPaymentRequestedAt`, `bankPaymentIdempotencyKey`, `nfmId` | `GET /admin/nfm`, `GET /admin/nfm/:id` |

### Fluxo sugerido na UI

1. **Tela lista** — `GET /admin/nfm?dateStart&dateEnd` exibe NFMs com NFS-e vinculada no intervalo.
2. Clique no item → `GET /admin/nfm/:id` para tela/detalhe.
3. Se NFS-e `ISSUED` → botão cancelar → `POST /admin/nfm/:id/cancel` com `cancelReasonCode`.
4. Botão **Gerar NFMs** → abre tela de elegíveis.
5. **Tela elegíveis** — `GET /admin/nfm/elegible`; botão confirmar → `POST /admin/nfm`.

---

## Listar NFMs geradas (`GET /admin/nfm`)

Retorna apenas NFMs com `nfseId` preenchido (já dispararam emissão no Giss).  
Filtro de data usa `createdAt` da NFM (UTC, dias inclusivos).

### Query

| Campo | Obrigatório | Tipo | Observação |
|-------|-------------|------|------------|
| `dateStart` | não | string `YYYY-MM-DD` | `createdAt >= início do dia` |
| `dateEnd` | não | string `YYYY-MM-DD` | `createdAt <= fim do dia` |
| `page` | não | number | Paginação |
| `size` | não | number | Paginação |

`dateStart` e `dateEnd` são **independentes**. Se ambos e `dateStart > dateEnd` → **400**.

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

Não há endpoint novo: os campos vêm em `GET /admin/nfm` e `GET /admin/nfm/:id` dentro de `nfse`. Não é breaking.

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
| `FAILED` | Recusada pelo Giss por regra de negócio, ou erro determinístico de configuração. A nota **não** existe do outro lado | sim | Mostrar `errorMessage` |
| `CANCELED` | Cancelada. `canceledAt` e `cancelReasonCode` preenchidos | sim | — |

### `AWAITING_PROVIDER` — o status novo

Status **aditivo**: uma tela que hoje trata qualquer coisa fora de `ISSUED`/`FAILED` como "em
andamento" não quebra, mas passa a mostrar a mensagem errada.

Significa: a requisição ao Giss terminou de forma ambígua — timeout, erro de rede, TLS, 5xx, ou o
próprio Giss respondendo que **já conhece aquele RPS**. A nota provavelmente foi emitida, e só uma
consulta ao provedor pode confirmar. Antes, esses casos viravam `FAILED`, o que fazia a operação
parar de procurar por uma nota que existia.

O motivo exato vem em `nfse.errorMessage`.

Regras de UI:

- **Não** é erro. Não usar cor/ícone de falha — usar estado de atenção ("aguardando confirmação do
  provedor").
- **Não** oferecer botão de reemitir. Reemitir às cegas duplica a nota fiscal.
- Nada resolve esse estado automaticamente hoje: a reconciliação com o Giss ainda não existe. A
  saída é consultar a nota no portal do provedor e resolver manualmente.
- Não habilitar cancelamento (só `ISSUED` cancela).

O backend já alerta por e-mail quando há notas nesse estado, então a UI não precisa notificar.

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

## Autenticação e claims

| Rota | Claim |
|------|-------|
| `GET /admin/nfm`, `GET /admin/nfm/elegible`, `GET /admin/nfm/:id` | `NFM_READ` |
| `POST /admin/nfm`, `POST /admin/nfm/:id/cancel` | `NFM_WRITE` |

---

## Checklist frontend

1. **Breaking:** migrar tela de elegíveis de `GET /admin/nfm` → `GET /admin/nfm/elegible`.
2. Nova tela lista: `GET /admin/nfm?dateStart&dateEnd&page&size` — resposta **paginada** (`data[]` de `NfmWithNfseDto`).
3. Detalhe: `GET /admin/nfm/:id` — mesmo `NfmWithNfseDto`; tratar **404**.
4. **Breaking:** parar `POST /admin/nfse`, `GET /admin/nfse/:id` e `POST /admin/nfse/:id/cancel`. Claims `NFSE_READ` / `NFSE_WRITE` saíram. Emissão via `POST /admin/nfm`; detalhe via `GET /admin/nfm/:id`; cancelamento via `POST /admin/nfm/:id/cancel` (id da **NFM**, claim `NFM_WRITE`).
5. Cancelar só quando `nfse.status === 'ISSUED'`; body `{ cancelReasonCode: 1 | 2 | 4 }`; após 200, refrescar detalhe.
5.1. **Aditivo:** tratar `AWAITING_PROVIDER` em `nfse.status` — estado de atenção, não de erro; sem botão de reemitir; sem botão de cancelar. Ver [Status da NFS-e](#status-da-nfs-e-nfsestatus).
5.2. **Aditivo:** na resposta do cancelamento, ler `bankPaymentCanceled` e `bankPaymentError`. Com `bankPaymentError` presente, avisar de forma persistente que a cobrança **não** foi cancelada e precisa de tratamento manual.
6. Botão gerar → tela elegíveis → confirmar com `POST /admin/nfm`.
7. `POST /admin/nfm`: exibir resumo `created` / `skipped` / `failed` + lista de `errors`.
8. Garantir cadastro fiscal antes de emitir: LC 116 na correspondência, ISS/Simples/`municipalTaxCode` na config da empresa, `issWithheld` no invoice config do cliente.
9. **Breaking:** `GET /admin/nfm/invoices` saiu. Parar de chamar a rota; regenerar tipos OpenAPI.
10. Atualizar mocks/tipos E2E (`GET /admin/nfm/:id`, `POST /admin/nfm/:id/cancel`).
