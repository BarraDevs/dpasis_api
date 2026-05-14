# Integração frontend — Query params do `GET /admin/client` (listagem)

## Introdução

Este documento descreve o contrato atual da listagem paginada de clientes (`FindAll`): filtros opcionais por campos do cadastro (substring **case-insensitive**), paginação e `active`. O query param global `search` **não faz parte deste endpoint** — o DTO omite o campo herdado de `Queries` e qualquer `search` enviado na querystring é **descartado na validação** (sem `400`).

**Referência OpenAPI:** Swagger em `/swagger`, tag **Clientes**.

**Relacionado:** [Busca avançada (`POST /admin/client/search`)](./frontend-integracao-cliente-search-filter.md) · [Nome social no cliente](./frontend-integracao-cliente-nome-social.md)

## Base URL admin

- Recurso: `GET /admin/client`
- Autenticação: JWT de **admin**
- Claim: **`CLIENT_READ`**

## Resumo das mudanças em relação ao padrão antigo de listagem com `Queries`

| Área | Comportamento |
|------|----------------|
| **Breaking / atenção** | O query param **`search` não é aplicado** neste endpoint (é removido do objeto validado). Não há busca textual única em vários campos no `GET`; usar filtros por campo abaixo ou **`POST /admin/client/search`** |
| **Breaking change** | O query param **`isSubClient`** não existe neste endpoint |
| **Aditivo** | Query params opcionais de texto listados abaixo (substring `contains` no banco) |
| **Sem mudança** | Paginação (`page`, `size`), `active`, formato da resposta paginada (`IPagination<ClientDto>`) |

## Contrato — query params

Herdados de `Queries` **exceto `search`**: `page`, `size`, `active`. Comportamento de paginação e `active` igual ao padrão do projeto.

### Removidos / inexistentes neste GET

| Query | Observação |
|-------|------------|
| `search` | Ignorado pelo pipeline de validação. Para operadores avançados ou combinar critérios como no Prisma, usar **`POST /admin/client/search`** |
| `isSubClient` | Para filtrar sub-clientes vs raiz, usar **`POST /admin/client/search`** com `filter.isSubClient` (ver [busca estruturada](./frontend-integracao-cliente-search-filter.md) ou Swagger) |

### Filtros opcionais (texto)

Todos são **substring case-insensitive** no banco (`contains`), alinhados ao `ClientDaoAdapterPrisma.findAll`. Vários informados são combinados com **AND** entre si e com `active` (quando `active` vem na query).

| Query | Descrição |
|-------|-----------|
| `companyName` | Razão social |
| `fantasyName` | Nome fantasia |
| `socialName` | Nome social |
| `document` | Documento (ex.: trecho do CNPJ) |
| `headquarters` | Sede / matriz |
| `domain` | Domínio (máx. **128** caracteres na validação) |
| `ie` | Inscrição estadual |

Strings vazias ou só espaços após `@Trim()` **não aplicam** filtro na DAO (equivalente a omitir o param).

Ordenação no backend: **`id` ascendente** (igual ao `findAll` e ao `search` no DAO de cliente).

## Erros / UX

- **400:** validação de query (ex.: `domain` com mais de 128 caracteres; tipo inválido onde se espera texto)
- Corpo típico: `{ "message": string }` (mensagens em **pt-BR** via `AppException` / filtro global)

## Checklist para o frontend

1. **Não** depender de `search` em `GET /admin/client`; remover de tipos e chamadas ou migrar para `POST /admin/client/search` / filtros por coluna.
2. Remover uso de `isSubClient` neste GET; onde necessário, usar `POST /admin/client/search`.
3. Tipar os query params opcionais como `string | undefined` na camada HTTP.
4. Atualizar cliente OpenAPI gerado ou mocks conforme Swagger.
5. Lembrar que filtros de texto **restringem** o resultado em conjunto (AND) com `active`, mas **não** substituem um “search global” — esse papel fica no POST de busca ou em múltiplos params no GET.
