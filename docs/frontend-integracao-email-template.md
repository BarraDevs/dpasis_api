# Integração frontend — templates de e-mail

CRUD admin de **templates** (assunto + HTML + CSS) e do **catálogo de variáveis** usadas no
placeholder `{{chave}}`. Há um `POST` de **render** que devolve o HTML interpolado. Esta entrega
**não envia e-mail**, **não anexa boleto** e **não busca NFS-e** — o body do render manda os valores.

## Base URL admin

JWT admin. Recursos novos. Não existe rota `user/`.

Variáveis (catálogo):

- `POST /admin/email-template-variable` — claim `EMAIL_TEMPLATE_VARIABLE_WRITE`
- `GET /admin/email-template-variable` — claim `EMAIL_TEMPLATE_VARIABLE_READ`
- `GET /admin/email-template-variable/:id` — claim `EMAIL_TEMPLATE_VARIABLE_READ`
- `PATCH /admin/email-template-variable/:id/status` — claim `EMAIL_TEMPLATE_VARIABLE_WRITE`
- `PATCH /admin/email-template-variable/:id` — claim `EMAIL_TEMPLATE_VARIABLE_WRITE`
- `DELETE /admin/email-template-variable/:id` — claim `EMAIL_TEMPLATE_VARIABLE_WRITE`

Templates:

- `POST /admin/email-template` — claim `EMAIL_TEMPLATE_WRITE`
- `GET /admin/email-template` — claim `EMAIL_TEMPLATE_READ`
- `POST /admin/email-template/:id/render` — claim `EMAIL_TEMPLATE_READ`
- `GET /admin/email-template/:id` — claim `EMAIL_TEMPLATE_READ`
- `PATCH /admin/email-template/:id/status` — claim `EMAIL_TEMPLATE_WRITE`
- `PATCH /admin/email-template/:id` — claim `EMAIL_TEMPLATE_WRITE`
- `DELETE /admin/email-template/:id` — claim `EMAIL_TEMPLATE_WRITE`

Não existe `GET /admin/email-template/variables`. O catálogo é a listagem de `/admin/email-template-variable`.

## Resumo das mudanças

| Área | O que mudou | Breaking? |
|---|---|---|
| Rotas admin | Recursos novos `/admin/email-template` e `/admin/email-template-variable` | Não (aditivo) |
| Claims CASL | `EMAIL_TEMPLATE_READ/WRITE` (subject `email-template`) e `EMAIL_TEMPLATE_VARIABLE_READ/WRITE` (subject `email-template-variable`) | Sim para quem for usar a tela: admin sem a claim fica fail-closed |
| Envio SMTP / anexo | Fora desta entrega | — |

## Variável (`EmailTemplateVariableDto`)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | number | |
| `key` | string | Única. Até 128. Começa com letra; depois letra, dígito, `_` ou `.` (ex.: `nfse.numero`) |
| `label` | string | Rótulo para o seletor do editor. Até 255 |
| `example` | string \| null | Até 1024. Opcional |
| `description` | string \| null | Até 8192. Opcional |
| `active` | boolean | Nasce `true`. Só muda em `PATCH :id/status` |
| `createdAt` / `updatedAt` | string ISO UTC | |

Create (`POST`) **não** recebe `active`. `example` e `description` omitidos ou `null`.

`PATCH` é parcial (`PartialType`). `null` em `example`/`description` limpa o campo.

`DELETE` sempre exclui, mesmo se algum template ainda usa `{{key}}`. O render passa a responder 400 até o template ser ajustado ou a chave ser recriada.

Listagem: `page`, `size`, `search` (em `key`, `label`, `description`), `active`. Ordenação por `key` ascendente.

Resposta de create: `201` `{ "id": number }`. Edição/status/exclusão: `{ "message": "..." }`.

## Template (`EmailTemplateDto`)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | number | |
| `name` | string | Único (case-insensitive). Até 255 |
| `description` | string \| null | Até 8192. Opcional |
| `subject` | string | Até 255. Aceita `{{chave}}` |
| `html` | string | Até 100000. Aceita `{{chave}}` |
| `css` | string | Até 100000. **Não** interpola variável. String vazia é válida |
| `active` | boolean | Nasce `true`. Só muda em `PATCH :id/status` |
| `createdAt` / `updatedAt` | string ISO UTC | |

Create **não** recebe `active`. `PATCH` parcial; `description: null` limpa.

Listagem: `page`, `size`, `search` (em `name`, `description`, `subject`), `active`. Ordenação por `createdAt` descendente.

Template **inativo** também renderiza (preview de rascunho).

## Placeholder

Sintaxe reconhecida: `{{chave}}` com espaços opcionais (`{{ nfse.numero }}`). A chave é **literal**, não caminho Angular. Trechos que não casam o padrão ficam no HTML.

O editor deve inserir só chaves do catálogo **ativo** (`GET /admin/email-template-variable?active=true`).

## Render (`POST /admin/email-template/:id/render`)

Body:

```json
{
  "variables": {
    "nfse.numero": "123",
    "cliente.nome": "ACME"
  }
}
```

Todos os valores são **string**. String vazia conta como valor. Chave extra no mapa é ignorada. A API **não** monta o mapa sozinha.

Resposta `200`:

```json
{
  "subject": "Nota 123",
  "html": "<style>p { color: red; }</style><p>ACME</p>"
}
```

Substituição crua, **sem** escape HTML. Se `css` não for vazio, o `html` devolvido começa com `<style>` + css + `</style>`. CSS não é interpolado.

## Autenticação e claims

| Recurso | Leitura (lista, detalhe, render) | Escrita (create, edit, status, delete) |
|---|---|---|
| Template | `EMAIL_TEMPLATE_READ` | `EMAIL_TEMPLATE_WRITE` |
| Variável | `EMAIL_TEMPLATE_VARIABLE_READ` | `EMAIL_TEMPLATE_VARIABLE_WRITE` |

Admins já existentes precisam da claim na UI de permissões ou `npm run db:seed` (o seed cobre `ALL_CLAIM_VALUES`).

## Erros / UX

Mensagens em `{ "message": string }`:

- `400` — validação de DTO; no render: variável inexistente/inativa (`A variável nfse.numero não está cadastrada ou está inativa.`) ou valor ausente (`A variável nfse.numero não recebeu valor.`)
- `404` — template ou variável não encontrados
- `409` — `name` ou `key` duplicados

Exibir `message`. No editor, falha de render por chave inativa/ausente deve apontar para o catálogo.

## Checklist

1. Tipar as duas tags OpenAPI (**Templates de e-mail** e **Variáveis de template de e-mail**).
2. Esconder o menu se o admin não tiver `EMAIL_TEMPLATE_READ` (e o CRUD de variáveis sem `EMAIL_TEMPLATE_VARIABLE_READ`).
3. Tela de variáveis primeiro: cadastrar chaves ativas; o seletor do editor usa `GET /admin/email-template-variable?active=true`.
4. Editor: inserir `{{key}}` no `subject`/`html`; `css` separado; preview via `POST /admin/email-template/:id/render` com o mapa de exemplos/valores.
5. `active` só via `PATCH :id/status` (toggle). Não enviar `active` no create.
6. Não implementar envio SMTP nem anexo nesta tela — o render só devolve `subject` + `html`.
7. Mocks E2E: template com `{{nfse.numero}}`; variável ativa; render com `variables["nfse.numero"]`; 400 se a variável for desativada.
