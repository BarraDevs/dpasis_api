# Integração frontend — Revenda × pronome de tratamento (`honorificId`)

## Introdução

Cada **revenda** (`Resale`) pode ter **no máximo um** pronome de tratamento vinculado (relação N:1 com o catálogo `Honorific`). O vínculo é **opcional** (`null`). O campo persistido é `honorificId`; nas **respostas** da API o front recebe apenas o objeto aninhado **`honorific`** (`{ id, name } | null`), no mesmo espírito do agregado **Cliente**.

**Referência OpenAPI:** Swagger em `/swagger`, tag **Revendas** (`CreateResaleInputDto`, `EditResaleInputDto`, wire de listagem/detalhe).

**Relacionado:**

- [CRUD de pronomes de tratamento](./frontend-integracao-honorific.md)
- [Cliente × pronome de tratamento](./frontend-integracao-cliente-honorific.md) — mesma regra de atribuição (somente pronome **ativo**) e leitura só via `honorific`
- [Campo `socialName` na revenda](./frontend-integracao-revenda-nome-social.md) — também usa `POST`/`PATCH` com `multipart/form-data`

## Base URL admin

- Prefixo: `/admin/resale`
- Autenticação: JWT de **admin**
- Claims: **`RESALE_READ`** / **`RESALE_WRITE`** (rotas já existentes; não há claim nova só por este vínculo)

## Resumo das mudanças

| Área | Comportamento |
|------|----------------|
| **Aditivo** | Campo opcional `honorificId` (`number \| null`) no corpo de **criação** (`POST`) e **edição** (`PATCH`), incluindo fluxo **multipart** |
| **Aditivo** | Respostas que retornam o agregado revenda incluem **`honorific`** (`{ id: number; name: string } \| null`), **sem** `honorificId` plano no DTO de leitura |
| **Regra** | Somente pronomes **ativos** podem ser **atribuídos** ou **trocados** em create/edit; manter vínculo com pronome **inativo** já existente não exige nova validação se o PATCH **omitir** `honorificId` (o valor atual é preservado) |
| **Exclusão de pronome** | `DELETE /admin/honorific/:id` retorna **409** se ainda existir **cliente** ou **revenda** referenciando o pronome |

## Contrato — criação (`POST /admin/resale`)

`Content-Type`: `multipart/form-data` (mesmo padrão da criação de revenda com arquivo opcional).

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| `honorificId` | `number` | Não | Inteiro positivo; pronome deve existir e estar **ativo** |
| `honorificId` | omitir / equivalente a sem pronome | Não | Tratar ausência como `null` no domínio |

## Contrato — edição (`PATCH /admin/resale/:id`)

Aceita **JSON** ou **multipart** conforme a rota já documentada para edição com upload.

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `honorificId` | `number` | Não — atribui ou troca (deve estar **ativo**) |
| `honorificId` | `null` | Não — **remove** o vínculo (`skipNullProperties: false` no partial, permitindo `null` explícito) |

Se `honorificId` **não** vier no PATCH, o vínculo atual permanece (incluindo pronome já gravado como inativo no catálogo).

## Contrato — respostas (lista paginada, detalhe)

Objetos revenda na API admin seguem o wire mapping do Swagger; o shape de leitura inclui:

| Campo | Tipo | Observação |
|-------|------|------------|
| `honorific` | `{ id: number; name: string } \| null` | `null` quando não há pronome vinculado |

**Não** espere `honorificId` no JSON de leitura — use `honorific?.id` se precisar do identificador na UI.

## Erros (UX)

| Situação | HTTP | Notas |
|----------|------|--------|
| `honorificId` inválido (validação) | 400 | Inteiro positivo (ex.: 0 rejeitado), conforme DTO |
| Pronome inexistente ou **inativo** ao **atribuir** | 404 | `HonorificNotFoundError` (mesmo padrão do cliente) |
| Excluir pronome ainda em uso | 409 | `HonorificInUseError` — cliente **ou** revenda ainda referencia |

## Checklist para o frontend

1. Tipar `Resale` nas respostas com `honorific` aninhado (sem `honorificId` plano).
2. FormData de criação/edição: incluir `honorificId` apenas quando houver seleção; enviar `null` ou campo vazio conforme convenção do backend para limpar em PATCH.
3. Seletor de pronome: alimentar com `GET /admin/honorific` (UX pode filtrar `active: true`).
4. Tela de exclusão no catálogo de pronomes: tratar **409** quando ainda houver cliente **ou** revenda vinculados.
