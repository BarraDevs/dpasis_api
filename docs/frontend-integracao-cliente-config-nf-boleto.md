# Integração frontend — Configuração de NF e boleto (`ClientInvoiceConfigDto`)

## Introdução

Este documento descreve uma alteração de contrato no objeto **`ClientInvoiceConfigDto`** retornado pela API quando a configuração é montada via camada de leitura (DAO). Afeta respostas que embutem esse tipo (ex.: busca por cliente e fluxo NFM).

**Referência OpenAPI:** Swagger em `/swagger`, tags **Clientes - Configuração NF e Boleto** e **NFM**.

**Relacionado:** [Query params do `GET /admin/client`](./frontend-integracao-cliente-find-all.md) · [NFM — clientes elegíveis (`GET /admin/nfm`)](./frontend-integracao-nfm.md)

## Base URL admin

- `GET /admin/client-invoice-config/client/:clientId` — JWT admin, claim **`CLIENT_INVOICE_CONFIG_READ`**
- `GET /admin/nfm` — lista elegíveis; cada item inclui `clientInvoiceConfig` no formato abaixo

**Sem mudança:** corpos de criação/edição continuam usando `billingAddressId` e `bankId` nos DTOs de entrada (`CreateClientInvoiceConfigInputDto`, `EditClientInvoiceConfigInputDto`).

## Resumo das mudanças

| Área | Comportamento |
|------|----------------|
| **Breaking change** | Nas **respostas** que expõem `ClientInvoiceConfigDto`, os campos **`billingAddressId`** e **`bankId` foram removidos** |
| **Aditivo** | Passam a vir sempre **`billingAddress`** (objeto endereço do cliente) e **`bank`** (objeto banco), no mesmo formato dos DTOs `ClientAddressDto` e `BankDto` já usados em outros endpoints |

### Campos aninhados — referência rápida

- **`billingAddress`:** `id`, `clientId`, `type`, `zipCode`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `active`, `createdAt`, `updatedAt`
- **`bank`:** `id`, `drawer`, `wallet`, `account`, `agency`, `bankCode`, `bankName`, `paymentLocation`, `active`, `createdAt`, `updatedAt`

## Checklist para o frontend

1. Remover uso de `billingAddressId` / `bankId` em tipos e telas que consumam **`ClientInvoiceConfigDto` na resposta**.
2. Passar a ler **`billingAddress.id`** e **`bank.id`** quando ainda precisar dos identificadores na UI.
3. Ajustar mocks E2E/OpenAPI gerado conforme Swagger atualizado.
4. Manter payloads de **POST/PATCH** como estão (continuam com IDs nas propriedades `billingAddressId` e `bankId`).
