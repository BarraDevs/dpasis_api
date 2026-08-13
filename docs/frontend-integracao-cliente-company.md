# Integração frontend — Cliente × Company 1:N (`/admin/client`)

## Introdução

Este documento cobre a **breaking change** na relação Cliente ↔ Empresa (Company): de N:N implícita para **1:N** (cada cliente vincula exatamente uma company; uma company pode ter N clients).

**Referência OpenAPI:** Swagger em `/swagger`, tag **Clientes**.

Não há rotas novas nem alteração de claims. Mudam **payload de create/edit**, **shape de resposta** e o **filtro avançado de search**.

## Base URL

| Recurso | Prefixo | Autenticação |
|---------|---------|--------------|
| Clientes | `/admin/client` | Admin + claims `CLIENT_READ` / `CLIENT_WRITE` |

## Resumo das mudanças

| Área | Antes | Depois |
|------|-------|--------|
| `POST /admin/client` — body | `companyIds: number[]` (mín. 1) | **`companyId: number`** (obrigatório, escalar) |
| `PATCH /admin/client/:id` — body | `companyIds?: number[]` | **`companyId?: number`** |
| Resposta de listagem / detalhe / search / sub-clients | `companies: { id, name }[]` | **`company: { id, name }`** |
| `POST /admin/client/search` — `filter` | sem filtro de company | **Aditivo:** `filter.companyId` (`IntFilterDto`) |

**Breaking change:** sim — frontend deve trocar array por escalar no request e objeto único no response.

## Create (`POST /admin/client`)

### Request (trecho relevante)

**Antes:**

```json
{
  "companyIds": [1, 2],
  "groupId": 1,
  "resaleId": 1
}
```

**Depois:**

```json
{
  "companyId": 1,
  "groupId": 1,
  "resaleId": 1
}
```

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| `companyId` | `number` (int positivo) | sim | Company deve existir e estar **ativa** |

Resposta inalterada: `{ "id": number }`.

## Edit (`PATCH /admin/client/:id`)

Body parcial. Para trocar a company:

```json
{
  "companyId": 2
}
```

Se `companyId` for omitido, mantém a company atual. Se informado, a company deve existir e estar ativa (`404` / `CompanyNotFoundError` caso contrário).

## Response (`ClientDto`)

**Antes:**

```json
{
  "id": 1,
  "group": { "id": 1, "name": "Grupo A" },
  "resale": { "id": 1, "name": "Revenda A" },
  "companies": [{ "id": 1, "name": "Empresa LTDA" }]
}
```

**Depois:**

```json
{
  "id": 1,
  "group": { "id": 1, "name": "Grupo A" },
  "resale": { "id": 1, "name": "Revenda A" },
  "company": { "id": 1, "name": "Empresa LTDA" }
}
```

Aplica-se a:

- `GET /admin/client`
- `GET /admin/client/:id`
- `POST /admin/client/search`
- `GET /admin/client/:id/sub-clients`

## Search avançado (`POST /admin/client/search`)

Filtro novo (mesmo padrão de `groupId` / `resaleId`):

```json
{
  "page": 1,
  "size": 20,
  "filter": {
    "companyId": { "equals": 1 }
  }
}
```

Use os operadores já existentes de `IntFilterDto` (`equals`, `in`, etc.).

`GET /admin/client` (FindAll) **não** ganha query `companyId` neste release.

## Autenticação e claims

| Ação | Claim |
|------|-------|
| Listar / detalhe / search | `CLIENT_READ` |
| Criar / editar / ativar / desativar | `CLIENT_WRITE` |

Sem claims novas.

## Erros / UX

| Situação | Status | Comportamento sugerido |
|----------|--------|------------------------|
| `companyId` ausente / inválido no create | `400` | Validação de formulário; exibir `message` |
| Company inexistente ou inativa | `404` | Mensagem da API (`CompanyNotFoundError`) |
| Demais regras de cliente | como antes | Exibir `message` do payload padronizado |

## Checklist prático para o frontend

1. Trocar campo do formulário de multi-select `companyIds` para select único `companyId`.
2. Atualizar tipos TypeScript / OpenAPI: request `companyId: number`; response `company: { id: number; name: string }`.
3. Remover loops/`map` sobre `companies[]` nas telas de detalhe e listagem; usar `client.company`.
4. Ajustar mocks E2E e fixtures que enviavam `companyIds: [...]`.
5. Se a tela de busca avançada filtrar por empresa, usar `filter.companyId`.
6. Regenerar/atualizar cliente OpenAPI se o projeto consumir o Swagger gerado.
