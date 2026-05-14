# Integração frontend — Campo `socialName` na revenda

## Introdução

Foi adicionado ao modelo de **revenda** o campo opcional **`socialName`** (nome social, **nullable** no banco). Ele aparece no corpo das rotas **`POST`** e **`PATCH`** (JSON ou `multipart/form-data`) e nas respostas que devolvem o agregado `Resale` (listagem paginada, detalhe).

**Referência OpenAPI:** Swagger em `/swagger`, tag **Revendas**.

**Relacionado:**

- Identificadores de revenda em **hexadecimal** nas rotas: exemplos e contrato no OpenAPI (`/swagger`), tag **Revendas**.
- [Pronome de tratamento na revenda](./frontend-integracao-revenda-honorific.md)
- Analogia ao cliente: [Campo `socialName` no cliente](./frontend-integracao-cliente-nome-social.md)

## Base URL admin

- Prefixo: `/admin/resale`
- Autenticação: JWT de **admin**
- Claims: **`RESALE_READ`** / **`RESALE_WRITE`** (conforme cada rota)

## Resumo das mudanças

| Área | Comportamento |
|------|----------------|
| **Aditivo** | Novo campo opcional `socialName` (`string \| null`) nos bodies de criar/editar quando aplicável |
| **Aditivo** | `socialName` incluído nos objetos revenda retornados pela API (wire: `ResaleWireDto` ↔ `ResaleWireSwaggerDto`) |
| **Aditivo** | O query `search` em **`GET /admin/resale`** considera também o campo **`socialName`** (contains, sem distinção de maiúsculas/minúsculas) |
| **Sem breaking change** | Revendas existentes continuam com `socialName: null` até serem editadas |

## Contrato

### Criação (`POST /admin/resale`)

`multipart/form-data` (campo texto opcional, mesmo padrão dos demais campos string opcionais).

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| `socialName` | string | Não | Opcional; pode enviar `null` para gravar vazio; omitir é aceito; trim aplicado; string só com espaços vira `null` no domínio |

### Edição (`PATCH /admin/resale/:id`)

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `socialName` | string \| null | Não (partial) |

### Respostas (lista paginada, detalhe `GET .../:id`)

Incluir no tipo da revenda (além dos campos já existentes, como nome, documento, `nickname`, etc.):

| Campo | Tipo |
|-------|------|
| `socialName` | string \| null |

### Busca textual (`GET /admin/resale?search=...`)

O valor de `search` passa a abranger também o campo **`socialName`**, nos mesmos termos já usados para nome, documento, identificador, apelido e e-mail de acesso.

## Checklist para o frontend

1. Atualizar tipos/interfaces da revenda com `socialName?: string | null` na entrada e `string \| null` na resposta, conforme o gerador usa o Swagger.
2. Formulários de cadastro/edição: campo opcional “Nome social”; permitir limpar (enviar `null` quando fizer sentido no fluxo multipart/JSON parcial).
3. Listagens e detalhe: tratar `null` como vazio na UI.
4. Se usar **`search`** na lista de revendas, considerar que o nome social também entra no termo pesquisado.
