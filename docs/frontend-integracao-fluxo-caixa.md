# Integração frontend — fluxo de caixa (livro-razão)

CRUD admin de lançamentos de **entrada (CREDIT)** e **saída (DEBIT)** por empresa, com filtro de
período. O pagamento confirmado de boleto (webhook Inter ou varredura) gera sozinho um CREDIT —
continuidade de [frontend-integracao-boleto-pagamento.md](frontend-integracao-boleto-pagamento.md).

## Base URL admin

JWT admin. Recurso novo:

- `POST /admin/cash-flow-entry` — claim `CASH_FLOW_ENTRY_WRITE`
- `GET /admin/cash-flow-entry` — claim `CASH_FLOW_ENTRY_READ` (`companyId` obrigatório)
- `GET /admin/cash-flow-entry/:id` — claim `CASH_FLOW_ENTRY_READ`
- `PATCH /admin/cash-flow-entry/:id` — claim `CASH_FLOW_ENTRY_WRITE`
- `DELETE /admin/cash-flow-entry/:id` — claim `CASH_FLOW_ENTRY_WRITE`

Não existe rota `user/`. **Não** chamar `POST /webhooks/inter/cobranca/:token`.

## Resumo das mudanças

| Área | O que mudou | Breaking? |
|---|---|---|
| Rotas admin | Recurso novo `/admin/cash-flow-entry` | Não (aditivo) |
| Claims CASL | `CASH_FLOW_ENTRY_READ` e `CASH_FLOW_ENTRY_WRITE` (subject `cash-flow-entry`) | Sim para quem for usar a tela: admin sem a claim fica fail-closed |
| Webhook Inter | Contrato inalterado | Não |
| NFS-e / NFM / boleto | Contrato inalterado | Não |

## Payload de um lançamento (`CashFlowEntryDto`)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | number | |
| `companyId` | number | Empresa do lançamento |
| `type` | `"CREDIT"` \| `"DEBIT"` | Entrada ou saída |
| `origin` | `"MANUAL"` \| `"BANK_PAYMENT"` | Só leitura. Create admin sempre grava `MANUAL` |
| `amountInCents` | number | Inteiro em **centavos** (15050 = R$ 150,50) |
| `occurredAt` | string ISO UTC | Data do fato (eixo do filtro de período) |
| `description` | string | Até 8192 caracteres |
| `nfseId` | number \| null | Preenchido no CREDIT automático do boleto |
| `bankPaymentRequestCode` | string \| null | Código da cobrança Inter, se houver |
| `createdAt` / `updatedAt` | string ISO UTC | |

`PATCH` **não** altera `origin`, `nfseId` nem `bankPaymentRequestCode`.

## Create (`POST`)

Body JSON:

```json
{
  "companyId": 1,
  "type": "CREDIT",
  "amountInCents": 15050,
  "occurredAt": "2026-09-17T12:00:00.000Z",
  "description": "Ajuste manual"
}
```

`type` aceita `CREDIT` ou `DEBIT`. Resposta `201`: `{ "id": number }`. Empresa inexistente ou inativa → `404` (`Empresa não encontrada na base de dados.`).

## Listagem (`GET`)

Query:

| Param | Obrigatório | Notas |
|---|---|---|
| `companyId` | sim | Sem ele a API responde 400 |
| `startDate` / `endDate` | não | ISO 8601 sobre `occurredAt`. Date-only (`2026-09-30`) é meia-noite UTC — para incluir o dia, use `2026-09-30T23:59:59.999Z` |
| `type` | não | `CREDIT` ou `DEBIT` |
| `search` | não | Busca em `description` (case-insensitive) |
| `page` / `size` | não | Paginação padrão do admin |

Resposta paginada no mesmo formato das outras listas (`data`, `totalItems`, `currentPage`, `itemsPerPage`, `totalPages`). Ordenação: `occurredAt` descendente.

## Edit / Delete

- `PATCH /admin/cash-flow-entry/:id` — body parcial dos campos do create. Resposta `{ "message": "Lançamento de fluxo de caixa atualizado com sucesso" }`.
- `DELETE /admin/cash-flow-entry/:id` — `{ "message": "Lançamento de fluxo de caixa excluído com sucesso" }`.
- Id inexistente → `404` (`Lançamento de fluxo de caixa não encontrado na base de dados.`).

## Lançamento automático do boleto

Quando a cobrança da NFS-e confirma **pago** (`PAID`, `RECEIVED` ou `MARKED_RECEIVED`), a API cria um CREDIT `origin=BANK_PAYMENT` (valor nominal do Inter em centavos). Cancelado/expirado **não** entra no livro. Idempotente por `nfseId` (retry do webhook não duplica).

A UI **não** precisa POST no livro ao pintar o boleto como pago — só listar/atualizar a tela de fluxo de caixa.

## Autenticação e claims

| Ação | Claim |
|---|---|
| Listar / detalhe | `CASH_FLOW_ENTRY_READ` |
| Criar / editar / excluir | `CASH_FLOW_ENTRY_WRITE` |

Admins já existentes precisam da claim na UI de permissões ou `npm run db:seed` (o seed cobre `ALL_CLAIM_VALUES`).

## Erros / UX

Mensagens em `{ "message": string }`:

- `400` — validação (`companyId` ausente, `type` inválido, `amountInCents` ≤ 0, data inválida)
- `404` — lançamento ou empresa não encontrados

Exibir `message`. Valores sempre em centavos; converter só na UI.

## Checklist

1. Tipar rotas e `CashFlowEntryDto` a partir do OpenAPI (tag **Fluxo de caixa**).
2. Esconder o menu se o admin não tiver `CASH_FLOW_ENTRY_READ`.
3. Listar sempre com `companyId`; período com `startDate`/`endDate` (fim do dia explícito se o datepicker for só data).
4. Formulário de create/edit: `amountInCents` inteiro; não enviar `origin`.
5. Distinguir na lista `origin=BANK_PAYMENT` (boleto) vs `MANUAL`.
6. Mocks E2E: CREDIT manual vs CREDIT `BANK_PAYMENT` com `nfseId` preenchido.
