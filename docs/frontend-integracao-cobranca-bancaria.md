# Integração frontend — Cobrança bancária (Bolepix)

## Introdução

Este documento cobre as rotas admin de **cobrança bancária** (boleto com Pix via Banco Inter, API Cobrança v3):

- `POST /admin/bank-payment` — emitir cobrança
- `GET /admin/bank-payment/:codigoSolicitacao` — recuperar cobrança
- `POST /admin/bank-payment/:codigoSolicitacao/cancel` — cancelar cobrança

**Referência OpenAPI:** Swagger em `/swagger`, tag **Cobrança bancária**.

A emissão no Inter é **assíncrona**: o `POST` devolve só o `requestCode` (`codigoSolicitacao`). Linha digitável, código de barras e Pix costumam aparecer no `GET` (ou via webhook, fora deste escopo).

## Base URL

| Recurso | Prefixo | Autenticação |
|---------|---------|--------------|
| Cobrança bancária | `/admin/bank-payment` | Admin JWT + claims `BANK_PAYMENT_*` |

---

## Resumo das mudanças

| Área | O que mudou |
|------|-------------|
| Endpoints | **Novos** (aditivo) — emitir / recuperar / cancelar |
| Claims | Novos subjects: `bank-payment` → `BANK_PAYMENT_READ` / `BANK_PAYMENT_WRITE` |
| Persistência | **Não** há registro da cobrança no banco da API nesta entrega — a fonte da verdade é o provedor |

---

## Autenticação e claims

| Rota | Claim |
|------|-------|
| `POST /admin/bank-payment` | `BANK_PAYMENT_WRITE` |
| `GET /admin/bank-payment/:codigoSolicitacao` | `BANK_PAYMENT_READ` |
| `POST /admin/bank-payment/:codigoSolicitacao/cancel` | `BANK_PAYMENT_WRITE` |

Admin sem essas claims → **403** (fail-closed). Atribuir na UI de permissões do admin (`subject`: `bank-payment`, ações read/write).

---

## Emitir cobrança (`POST /admin/bank-payment`)

### Body

| Campo | Obrigatório | Tipo | Observação |
|-------|-------------|------|------------|
| `provider` | sim | `"INTER"` | Único provedor nesta versão |
| `yourNumber` | sim | string | Seu número / referência (máx. 15) |
| `amount` | sim | number | Valor nominal (positivo, até 2 casas) |
| `dueDate` | sim | string | `YYYY-MM-DD` |
| `daysAfterDue` | sim | number | Dias após vencimento (≥ 0) |
| `payer` | sim | object | Pagador |
| `payer.document` | sim | string | CPF/CNPJ |
| `payer.personType` | sim | `"INDIVIDUAL"` \| `"COMPANY"` | PF / PJ |
| `payer.name` | sim | string | Nome |
| `payer.email` | não | string | |
| `payer.areaCode` | não | string | DDD |
| `payer.phone` | não | string | |
| `payer.street` | não | string | |
| `payer.number` | não | string | |
| `payer.complement` | não | string | |
| `payer.neighborhood` | não | string | |
| `payer.city` | não | string | |
| `payer.state` | não | string | UF |
| `payer.zipCode` | não | string | CEP |

### Response (201)

```json
{
  "provider": "INTER",
  "requestCode": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

Guarde `requestCode` para consultar e cancelar.

### Fluxo sugerido na UI

1. Usuário confirma emissão → `POST /admin/bank-payment`.
2. Exibir `requestCode` e disparar `GET` (polling leve) até status/`boleto`/`pix` estarem disponíveis.
3. Não assumir barcode/Pix no retorno do `POST`.

---

## Recuperar cobrança (`GET /admin/bank-payment/:codigoSolicitacao`)

### Path

| Campo | Tipo |
|-------|------|
| `codigoSolicitacao` | string (`requestCode` do emit) |

### Query

| Campo | Obrigatório | Tipo |
|-------|-------------|------|
| `provider` | sim | `"INTER"` |

Ex.: `GET /admin/bank-payment/req-123?provider=INTER`

### Response (200)

Campos principais:

| Campo | Tipo | Observação |
|-------|------|------------|
| `provider` | string | |
| `requestCode` | string | |
| `yourNumber` | string | |
| `status` | enum | Ver tabela abaixo |
| `amount` | number | |
| `dueDate` | string | |
| `daysAfterDue` | number? | |
| `payer` | object | Shape alinhado ao emit |
| `boleto` | object? | `ourNumber`, `barcode`, `digitableLine` |
| `pix` | object? | `txid`, `copyAndPaste` |

### Status (`status`)

| Valor API | Significado típico |
|-----------|--------------------|
| `RECEIVED` | Recebido / em processamento |
| `AWAITING_APPROVAL` | Aguardando aprovação |
| `EMITTED` | Emitido / em aberto |
| `PAID` | Pago |
| `CANCELLED` | Cancelado |
| `EXPIRED` | Expirado |
| `MARKED_RECEIVED` | Marcado como recebido |
| `FAILED` | Falha |
| `UNKNOWN` | Situação não mapeada no provedor |

---

## Cancelar cobrança (`POST /admin/bank-payment/:codigoSolicitacao/cancel`)

### Path

| Campo | Tipo |
|-------|------|
| `codigoSolicitacao` | string |

### Body

| Campo | Obrigatório | Tipo |
|-------|-------------|------|
| `provider` | sim | `"INTER"` |
| `reason` | sim | enum abaixo |

### `reason`

| Valor | Uso |
|-------|-----|
| `ADJUSTMENTS` | Acertos |
| `CUSTOMER_REQUEST` | A pedido do cliente |
| `PAID_DIRECTLY_TO_CUSTOMER` | Pago direto ao cliente |
| `REPLACEMENT` | Substituição |

### Response (200)

```json
{
  "message": "Cobrança bancária cancelada com sucesso."
}
```

---

## Erros / UX

Exibir sempre `message` do payload padronizado.

| Status | Quando |
|--------|--------|
| 400 | Validação de body/query ou provedor/motivo inválido; ou erro 4xx do Inter |
| 403 | Sem claim |
| 404 | Cobrança não encontrada no provedor |
| 503 | Inter/API externa indisponível (`INTER_PROVIDER_ENABLED=false` sem strategy → tipicamente erro de provedor não suportado / 400) |

---

## Checklist prático para o frontend

1. Tipar OpenAPI / DTOs com `provider`, `requestCode`, `payer.personType`, `reason`.
2. Tela de emissão: após 201, navegar para detalhe com `requestCode` e `provider=INTER`.
3. Detalhe: `GET` com query `provider`; mostrar `boleto`/`pix` quando existirem.
4. Cancelar: modal com select de `reason` + `POST .../cancel`.
5. Menu/permissões: incluir subject **Cobrança bancária** (`bank-payment`) read/write.
6. Não persistir cobrança local nesta fase — listagem histórica virá em feature futura.
