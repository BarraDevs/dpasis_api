# Integração frontend — CRUD de pronomes de tratamento (honoríficos)

## Introdução

Foi adicionado um catálogo isolado de **pronomes de tratamento** (ex.: Sr., Sra., Dr., Dra.), com CRUD administrativo e alternância de status ativo/inativo. **Clientes** e **revendas** podem referenciar um pronome opcional via `honorificId` na escrita; enquanto houver **algum** cliente ou revenda vinculados, o pronome **não** pode ser excluído (HTTP 409).

**Relacionado:**

- [Cliente × pronome de tratamento](./frontend-integracao-cliente-honorific.md) — payload e objeto `honorific` nas respostas
- [Revenda × pronome de tratamento](./frontend-integracao-revenda-honorific.md) — mesmo padrão para `POST`/`PATCH` admin e leituras

**Referência OpenAPI:** Swagger em `/swagger`, tag **Pronomes de tratamento**.

## Base URL admin

- Prefixo: `/admin/honorific`
- Autenticação: JWT de **admin** (`AccountRole.ADMIN`)
- Claims: `HONORIFIC_READ` (leitura / listagem / detalhe) e `HONORIFIC_WRITE` (criar, editar, excluir, alternar status)

Após deploy, contas admin recebem as novas claims via seed de `AccountClaim` (objeto `Claim` / `ALL_CLAIM_VALUES`).

## Resumo das mudanças

| Área | Comportamento |
|------|----------------|
| **Novo** | CRUD completo + `PATCH :id/status` para inverter `active` |
| **Modelo** | Campo `name` único no catálogo (64 caracteres); validação de duplicidade também **case-insensitive** na aplicação |

## Contrato — entidade `Honorific`

Objeto retornado nas leituras (e itens da lista paginada):

| Campo | Tipo | Observação |
|-------|------|------------|
| `id` | `number` | |
| `name` | `string` | Ex.: `Sr.`, `Dr.` |
| `active` | `boolean` | |
| `createdAt` | `string` (ISO date) | |
| `updatedAt` | `string` (ISO date) | |

## Endpoints

| Método | Rota | Claim | Corpo / query | Resposta |
|--------|------|-------|---------------|----------|
| `POST` | `/admin/honorific` | `HONORIFIC_WRITE` | JSON `{ "name": string }` | `{ "id": number }` |
| `GET` | `/admin/honorific` | `HONORIFIC_READ` | Query padrão `Queries`: `page`, `size`, `search`, `active` | Paginação (`currentPage`, `itemsPerPage`, `totalItems`, `totalPages`, `data`) |
| `GET` | `/admin/honorific/:id` | `HONORIFIC_READ` | — | `Honorific` |
| `PATCH` | `/admin/honorific/:id/status` | `HONORIFIC_WRITE` | — | `{ "message": string }` (toggle de `active`) |
| `PATCH` | `/admin/honorific/:id` | `HONORIFIC_WRITE` | JSON parcial `{ "name"?: string }` | `{ "message": string }` |
| `DELETE` | `/admin/honorific/:id` | `HONORIFIC_WRITE` | — | `{ "message": string }` |

**Ordem de rotas:** `PATCH .../:id/status` está registrado **antes** de `PATCH .../:id` (igual ao padrão FAQ).

### Criação

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| `name` | `string` | Sim | Trim + máx. 64 caracteres |

### Edição

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `name` | `string` | Não (partial) |

### Listagem — query

| Parâmetro | Tipo | Observação |
|-----------|------|------------|
| `page` | número | Opcional |
| `size` | número | Opcional |
| `search` | string | Busca em `name` (contém, case-insensitive) |
| `active` | boolean | Filtro opcional |

## Autenticação e claims

| Recurso (subject CASL) | Valor `subject` | Leitura | Escrita |
|------------------------|-----------------|---------|---------|
| Pronomes de tratamento | `honorific` | `HONORIFIC_READ` | `HONORIFIC_WRITE` |

## Erros (UX)

Respostas de erro seguem o filtro global: corpo com `message` em português.

| Situação | HTTP | Exemplo de mensagem |
|----------|------|---------------------|
| Validação de entrada | 400 | Mensagens de `class-validator` com `$property` |
| Registro inexistente | 404 | `Pronome de tratamento não encontrado na base de dados.` |
| Nome já usado (inclui mesma grafia com caixa diferente na regra de aplicação) | 409 | `Já existe um pronome de tratamento com o nome: …` |
| Pronome referenciado por cliente(s) ou revenda(s) | 409 | `Este pronome de tratamento está associado a um ou mais clientes ou revendas e não pode ser excluído.` |

## Checklist para o frontend

1. Garantir que o perfil admin tenha `HONORIFIC_READ` / `HONORIFIC_WRITE` (reseed ou inclusão manual em `account_claims` se necessário em ambientes antigos).
2. Mapear tipos a partir do Swagger (`Honorific`, paginação, `SuccessMessage`).
3. Na listagem, usar `search` e `active` conforme UX (filtro de ativos).
4. Tratar **409** ao salvar nome duplicado, **409** ao excluir pronome ainda vinculado a **cliente ou revenda**, e **404** ao abrir/editar ID inválido.
