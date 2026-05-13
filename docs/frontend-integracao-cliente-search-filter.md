# Integração frontend — Busca avançada de clientes (filtros aninhados)

## Introdução

Este documento descreve o novo endpoint **`POST /admin/client/search`**, que permite listar clientes com **filtros estruturados no corpo JSON** (operadores por campo, combinados com **AND** entre campos). O endpoint legado **`GET /admin/client`** permanece disponível (querystring: `page`, `size`, `search`, `active`, `isSubClient`).

**Escopo:** apenas campos **diretos** do modelo `Client` no banco (sem filtros em relacionamentos aninhados como nome de grupo ou empresa).

**Referência OpenAPI:** Swagger em `/swagger`, tag **Clientes**.

## Base URL admin

- Path: `/admin/client/search`
- Autenticação: JWT de **admin**
- Claim: **`CLIENT_READ`** (mesma leitura da listagem atual)

## Resumo das mudanças

| Área | Comportamento |
|------|----------------|
| Novo | `POST /admin/client/search` com body JSON (`page`, `size`, `filter`) |
| Inalterado | `GET /admin/client` — paginação e busca textual ampla (`search`) |
| Sem breaking change | Rotas e contratos existentes de cliente não foram removidos |

## Contrato da requisição

**Método e URL:** `POST /admin/client/search`  
**Content-Type:** `application/json`  
**HTTP status:** `200 OK` (listagem retornada no corpo; não é `201`)

### Corpo (`SearchClientInputDto`)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `page` | number | Não | Página (inteiro positivo), igual ao padrão de `Queries` |
| `size` | number | Não | Itens por página (inteiro positivo) |
| `filter` | objeto | Não | Mapa campo → filtro. Cada chave é um campo permitido; ausência de `filter` ou objeto vazio lista sem restrição extra além da paginação |

### Formato de `filter`

Cada propriedade de `filter` é um objeto de operadores. **Vários campos em `filter` são unidos com AND.** No mesmo campo, vários operadores coexistem como no Prisma (ex.: `gte` + `lte` em datas).

**Tipos de filtro por campo** (whitelist — chaves desconhecidas são **removidas silenciosamente** pelo `ValidationPipe`, sem `400`):

#### Campos inteiros (`IntFilterDto`)

`id`, `parentClientId`, `groupId`, `resaleId`, `attendanceId`, `maintenanceTicketId`

| Operador | Tipo do valor | Exemplo |
|----------|----------------|---------|
| `eq` | number | `{ "groupId": { "eq": 5 } }` |
| `ne` | number | `{ "id": { "ne": 1 } }` |
| `in` | number[] | `{ "groupId": { "in": [1, 2, 3] } }` |
| `notIn` | number[] | |
| `gt`, `gte`, `lt`, `lte` | number | |
| `isNull` | boolean | `true` → valor SQL `NULL`; `false` → `NOT NULL` |

#### Campos texto (`StringFilterDto`)

`type`, `document`, `ie`, `companyName`, `fantasyName`, `socialName`, `domain`, `headquarters`, `invoiceType`

| Operador | Tipo | Notas |
|----------|------|--------|
| `eq`, `ne` | string | |
| `in`, `notIn` | string[] | |
| `contains`, `startsWith`, `endsWith` | string | `contains` / `startsWith` / `endsWith` usam **case-insensitive** no banco |
| `isNull` | boolean | |

#### Campos booleanos (`BooleanFilterDto`)

`isSubClient`, `generateInvoice`, `active`

| Operador | Tipo |
|----------|------|
| `eq` | boolean |
| `isNull` | boolean |

#### Datas (`DateFilterDto`)

`createdAt`, `updatedAt`

| Operador | Tipo | Validação |
|----------|------|-----------|
| `eq`, `ne`, `gt`, `gte`, `lt`, `lte` | string | **ISO 8601** (ex.: `2026-01-01T00:00:00.000Z`) |
| `isNull` | boolean | |

### Exemplo de body

```json
{
  "page": 1,
  "size": 20,
  "filter": {
    "groupId": { "in": [1, 2, 3] },
    "document": { "eq": "12345678901234" },
    "active": { "eq": true },
    "createdAt": {
      "gte": "2026-01-01T00:00:00.000Z",
      "lte": "2026-12-31T23:59:59.999Z"
    },
    "parentClientId": { "isNull": true }
  }
}
```

## Contrato da resposta

Igual à listagem paginada existente: **`IPagination<ClientDto>`** (mesmo shape de `GET /admin/client`):

- `currentPage`, `itemsPerPage`, `totalItems`, `totalPages`, `data[]`

Sem `page`/`size` no body, o VO `Pagination` assume página **1** e `itemsPerPage` coerente com o total (comportamento já usado em outros fluxos).

## Erros e UX

| Status | Quando |
|--------|--------|
| `400` | Payload validação `class-validator` (operador inválido, tipo errado, ISO inválido em data, etc.) |
| `403` | Sem permissão / claim |
| `401` | Token ausente ou inválido |

Corpo típico: `{ "message": "..." }` (mensagem em **pt-BR**).

**Nota:** enviar uma propriedade **não listada** dentro de `filter` não gera `400`; o campo é ignorado (whitelist). Para depuração, prefira conferir o payload exato no network tab.

## Limitações atuais (v1)

- Apenas **AND** entre campos (sem grupos `(A OR B)`).
- Sem `orderBy` custom no body — ordenação fixa no backend (**`id` ascendente**), igual ao `findAll` do DAO de cliente.
- Filtros **não** incluem campos de `group`, `resale`, `companies`, etc.

## Checklist prático para o frontend

1. Tipar o body com `page?`, `size?`, `filter?` e sub-objetos por campo conforme a tabela acima.
2. Usar **`CLIENT_READ`** na rota; reutilizar o mesmo interceptor de JWT do `GET /admin/client`.
3. Manter `GET /admin/client` para busca rápida por texto único (`search` multi-campo); usar **`POST .../search`** quando precisar de operadores (`in`, intervalos de data, `isNull`, etc.).
4. Atualizar mocks E2E e fixtures para o novo path e JSON de `filter`.
5. Conferir o schema no Swagger (`/swagger`) após deploy.

## Reuso futuro (backend)

O pacote de DTOs genéricos e a função `compileFilter` vivem em `src/shared/filtering/`; outros módulos poderão expor `POST .../search` com o mesmo padrão de `filter` e whitelists próprias.
