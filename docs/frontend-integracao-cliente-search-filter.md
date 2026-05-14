# Integração frontend — Busca avançada de clientes (filtros aninhados)

## Introdução

Este documento descreve o endpoint **`POST /admin/client/search`**, que lista clientes com **filtros estruturados no corpo JSON** (operadores por campo, combinados com **AND** entre campos). A listagem por querystring **`GET /admin/client`** permanece com paginação (`page`, `size`), `active` e filtros opcionais por campos de texto — **sem** query param `search` válido (veja [listagem GET](./frontend-integracao-cliente-find-all.md)).

**Escopo:** apenas campos **diretos** do modelo `Client` no banco (sem filtros em relacionamentos aninhados como nome de grupo ou empresa).

**Referência OpenAPI:** Swagger em `/swagger`, tag **Clientes**.

**Relacionado:** [Query params do `GET /admin/client`](./frontend-integracao-cliente-find-all.md)

## Base URL admin

- Path: `/admin/client/search`
- Autenticação: JWT de **admin**
- Claim: **`CLIENT_READ`** (mesma leitura da listagem)

## Resumo das mudanças

| Área | Comportamento |
|------|----------------|
| Novo | `POST /admin/client/search` com body JSON (`page`, `size`, `filter`) |
| Complementar | `GET /admin/client` — filtros por coluna + `active`; **não** usar `search` no GET |
| Sem breaking change neste POST | Contrato do POST é estável; o GET de listagem evoluiu em paralelo (sem `search` aplicado) |

## Contrato da requisição

**Método e URL:** `POST /admin/client/search`  
**Content-Type:** `application/json`  
**HTTP status:** `200 OK` (listagem no corpo; não é `201`)

### Corpo (`SearchClientInputDto`)

Herda paginação de `SearchRequestDto` (`page`, `size` opcionais). Campo aninhado `filter` usa `ClientSearchFilterDto`.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `page` | number | Não | Página (inteiro positivo) |
| `size` | number | Não | Itens por página (inteiro positivo) |
| `filter` | objeto | Não | Mapa campo → filtro. Ausência ou objeto vazio lista só com paginação |

### Formato de `filter`

Cada propriedade de `filter` é um objeto de operadores. **Vários campos em `filter` são unidos com AND.** No mesmo campo, vários operadores coexistem como no Prisma (ex.: `gte` + `lte` em datas).

Propriedades **não declaradas** em `ClientSearchFilterDto` são removidas pelo `ValidationPipe` global (`whitelist: true`), sem `400`.

**Tipos de filtro por campo** (conforme DTOs em `src/shared/filtering/` e `ClientSearchFilterDto`):

#### Campos inteiros (`IntFilterDto`)

`id`, `parentClientId`, `groupId`, `resaleId`, `attendanceId`, `maintenanceTicketId`

| Operador | Tipo do valor | Exemplo |
|----------|----------------|---------|
| `eq` | number | `{ "groupId": { "eq": 5 } }` |
| `ne` | number | `{ "id": { "ne": 1 } }` |
| `in` | number[] | `{ "groupId": { "in": [1, 2, 3] } }` |
| `notIn` | number[] | |
| `gt`, `gte`, `lt`, `lte` | number | |
| `isNull` | boolean | `true` → `NULL`; `false` → `NOT NULL` |

#### Campos texto (`StringFilterDto`)

`type`, `document`, `ie`, `companyName`, `fantasyName`, **`socialName`**, `domain`, `headquarters`, `invoiceType`

| Operador | Tipo | Notas |
|----------|------|--------|
| `eq`, `ne` | string | |
| `in`, `notIn` | string[] | |
| `contains`, `startsWith`, `endsWith` | string | **Case-insensitive** no banco |
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
| `eq`, `ne`, `gt`, `gte`, `lt`, `lte` | string | **ISO 8601** (ex.: `2026-01-01T00:00:00.000Z`). No backend, strings muito curtas ou sem padrão de data não são tratadas como filtro de data no compilador |
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

Igual à listagem paginada: **`IPagination<ClientDto>`** (mesmo shape do `GET /admin/client`):

- `currentPage`, `itemsPerPage`, `totalItems`, `totalPages`, `data[]`

Sem `page`/`size` no body, o `Pagination` assume default de página/tamanho como nos demais fluxos do projeto.

## Erros e UX

| Status | Quando |
|--------|--------|
| `400` | Payload falha na validação `class-validator` (operador inválido, tipos, etc.) |
| `403` | Sem permissão / claim |
| `401` | Token ausente ou inválido |

Corpo típico: `{ "message": "..." }` (mensagem em **pt-BR**).

**Nota:** chaves extras dentro de `filter` (fora do DTO) não geram `400`; são eliminadas pelo whitelist. Para depuração, conferir o payload no network tab.

## Limitações atuais (v1)

- Apenas **AND** entre campos (sem grupos `(A OR B)`).
- Sem `orderBy` no body — ordenação fixa (**`id` ascendente**), igual ao DAO de cliente.
- Filtros **não** incluem campos de `group`, `resale`, `companies`, etc.

## Checklist prático para o frontend

1. Tipar o body com `page?`, `size?`, `filter?` e sub-objetos por campo conforme a tabela acima.
2. Usar **`CLIENT_READ`** na rota; reutilizar o mesmo interceptor de JWT do `GET /admin/client`.
3. Para “campo único estilo busca” no **GET**, usar os query params documentados em [find-all](./frontend-integracao-cliente-find-all.md); para `in`, intervalos de data, `isNull`, `eq` exato em vários critérios, etc., usar **`POST .../search`**.
4. Atualizar mocks E2E e fixtures para o path e o JSON de `filter`.
5. Conferir o schema no Swagger (`/swagger`) após deploy.

## Implementação de referência (backend)

O `filter` validado é compilado para fragmentos `where` via `PrismaFilterCompilerService` (`compileWhereFragments`); o adapter está em `ClientDaoAdapterPrisma.search`. DTOs de filtro genéricos em `src/shared/filtering/`.
