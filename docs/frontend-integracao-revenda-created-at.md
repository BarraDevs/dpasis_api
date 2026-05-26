# Integração frontend — Data de cadastro da revenda (`createdAt`)

## Introdução

O cadastro de revenda (`POST /admin/resale`) passa a aceitar **`createdAt` opcional** para importar ou alinhar a data de cadastro legada. O campo **não pode ser alterado** após a criação (não existe no body de edição).

**Referência OpenAPI:** Swagger em `/swagger`, tag **Revendas**.

Guia relacionado (cliente): [`frontend-integracao-cliente-created-at.md`](frontend-integracao-cliente-created-at.md).

## Base URL admin

- Prefixo: **`/admin/resale`**
- Autenticação: admin + claims **`RESALE_READ`** / **`RESALE_WRITE`**
- Criação: **`multipart/form-data`** (campo de arquivo opcional `file` para foto de perfil)

## Resumo das mudanças

| Área | Antes | Depois |
|------|--------|--------|
| `POST /admin/resale` | `createdAt` definido só pelo servidor (`now()`) | Campo opcional **`createdAt`** no formulário (`yyyy-mm-dd`) |
| `PATCH /admin/resale/:id` | — | **`createdAt` não faz parte do contrato** (removido pelo whitelist se enviado) |
| Respostas de leitura | `createdAt` em `ResaleDto` / wire | **Sem mudança** |

## `POST /admin/resale` — multipart

Campo **opcional** (texto no `FormData`, junto aos demais campos):

| Campo | Tipo | Formato | Descrição |
|-------|------|---------|-----------|
| `createdAt` | `string` | `yyyy-mm-dd` | Data de cadastro legada. Ex.: `2020-03-15`. Se omitido, o servidor usa a data/hora atual. |

### Semântica de timezone

A API interpreta a string como **início do dia em UTC**:

- `"2020-03-15"` → `2020-03-15T00:00:00.000Z` no banco
- Não enviar hora (`2020-03-15T10:00:00.000Z` é **rejeitado** na validação)

### Diferença em relação a `validityDate`

| Campo | Formato | Uso |
|-------|---------|-----|
| `createdAt` | `yyyy-mm-dd` | Data de **cadastro** legada (novo, só na criação) |
| `validityDate` | ISO 8601 (ex.: `2026-04-01T03:00:00.000Z`) | Validade contratual — **inalterado** |

### Exemplo (montagem do FormData)

```javascript
const form = new FormData();
form.append('type', 'PJ');
form.append('code', 'REV-001');
form.append('name', 'Revenda Exemplo');
// ... demais campos obrigatórios ...
form.append('createdAt', '2020-03-15'); // opcional
// form.append('file', file); // foto opcional
```

## `PATCH /admin/resale/:id`

- **Não enviar** `createdAt` no body de edição (JSON ou multipart, conforme o endpoint de edit do app).
- O valor persistido na criação permanece inalterado.

## Autorização

| Recurso | Read | Write |
|---------|------|-------|
| Revenda | `RESALE_READ` | `RESALE_WRITE` |

Sem novas claims.

## Erros (UX)

| Situação | HTTP | `message` (exemplo) |
|----------|------|---------------------|
| Formato inválido (`03/15/2020`, `2020-3-5`, ISO com hora) | 400 | `$property deve estar no formato yyyy-mm-dd` |
| Data inválida (calendário) | 400 | `O campo createdAt deve ser uma data válida.` |

Exibir sempre o `message` retornado pela API.

## Checklist prático para o frontend

1. Exibir seletor de **data de cadastro** apenas no fluxo de **criação** de revenda.
2. Enviar `createdAt` como string `yyyy-mm-dd` no `FormData` (sem hora).
3. Omitir o campo quando o usuário não informar data legada.
4. Não confundir com `validityDate` (continua ISO 8601).
5. Atualizar tipos gerados a partir do OpenAPI (`CreateResaleInputDto.createdAt?`).
6. Manter exibição de `createdAt` nas telas de detalhe/listagem como já retornado pela API (id em hex no wire).
