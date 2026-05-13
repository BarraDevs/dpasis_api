# Integração frontend — Campo `socialName` no cliente

## Introdução

Foi adicionado ao modelo de **cliente** o campo opcional **`socialName`** (nome social, **nullable** no banco). Ele aparece nos payloads de **criação**, **edição** e em todas as respostas que devolvem o agregado `Client` (listagem, busca, detalhe).

**Referência OpenAPI:** Swagger em `/swagger`, tag **Clientes**.

**Relacionado:** [Busca avançada com filtros](./frontend-integracao-cliente-search-filter.md) — o campo `socialName` também pode ser usado em `filter` no `POST /admin/client/search`.

## Base URL admin

- Prefixo habitual: `/admin/client`
- Autenticação: JWT de **admin**
- Claims: as mesmas já usadas para cliente (**`CLIENT_READ`**, **`CLIENT_WRITE`**, etc., conforme cada rota)

## Resumo das mudanças

| Área | Comportamento |
|------|----------------|
| **Aditivo** | Novo campo opcional `socialName` (`string \| null`) no body de criação/edição quando aplicável |
| **Aditivo** | `socialName` incluído nos objetos cliente retornados pela API |
| **Sem breaking change** | Clientes existentes continuam com `socialName: null` até serem editados |

## Contrato

### Criação (`POST /admin/client`)

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| `socialName` | string | Não | Opcional; enviar `null` para gravar vazio; omitir é aceito |

Validação alinhada aos opcionais similares (`fantasyName`): trim; string vazia ou só espaços é normalizada para `null` no domínio.

### Edição (`PATCH /admin/client/:id`)

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `socialName` | string \| null | Não (partial) |

### Respostas (lista, detalhe, busca)

Incluir no tipo do cliente:

| Campo | Tipo |
|-------|------|
| `socialName` | string \| null |

### Busca textual (`GET /admin/client?search=...`)

O parâmetro `search` passa a considerar também o campo **`socialName`** (além de razão social, nome fantasia, domínio e documento, como já ocorria).

### Busca estruturada (`POST /admin/client/search`)

Em `filter`, campo texto opcional:

| Chave em `filter` | Tipo de filtro |
|-------------------|----------------|
| `socialName` | `StringFilterDto` (mesmos operadores dos demais campos string) |

## Checklist para o frontend

1. Atualizar tipos/interfaces do cliente com `socialName?: string | null` (ou obrigatório `| null` na resposta, conforme o gerador).
2. Formulários de cadastro/edição: campo opcional “Nome social”; permitir limpar (enviar `null` no PATCH quando a API aceitar partial).
3. Listas e detalhe: exibir coluna ou linha somente se o produto exigir; tratar `null` como vazio na UI.
4. Se usar `search` ou `POST .../search`, documentar para o usuário que o nome social entra na busca ampla e pode ser filtrado em `filter.socialName`.
