# Integração frontend — credenciais Inter no CRUD de bancos

O admin passa a cadastrar **API keys e certificado** do Banco Inter no próprio banco. A listagem e o
GET **nunca** devolvem secret, senha, token, PEM nem path. Continuidade do boleto:
[frontend-integracao-boleto-pagamento.md](frontend-integracao-boleto-pagamento.md).

## Base URL admin

JWT admin, claims existentes (`BANK_READ` / `BANK_WRITE`). Sem claim nova.

- `POST /admin/bank` — JSON
- `PATCH /admin/bank/:id` — JSON
- `GET /admin/bank` e `GET /admin/bank/:id`
- `POST /admin/bank/:id/certificate` — `multipart/form-data`
- `POST /admin/bank/:id/webhook-token` — JSON vazio, devolve o token uma vez
- `DELETE /admin/bank/:id` — também apaga os arquivos cifrados do certificado

Não existe rota `user/`.

## Resumo das mudanças

| Área | O que mudou | Breaking? |
|---|---|---|
| `POST /admin/bank` | Campos opcionais `apiUrl`, `clientId`, `clientSecret`, `webhookToken`. Resposta `{ id, webhookToken? }` | Aditivo no body. **Resposta deixou de ser só `{ id }`** se keys foram gravadas |
| `PATCH /admin/bank/:id` | Mesmos campos opcionais. Omitir/vazio em segredo **não altera** o valor já gravado | Não (aditivo). Não dá para apagar secret com string vazia |
| `GET` / listagem | Flags: `apiUrl`, `clientIdHint`, `hasClientSecret`, `hasCertificate`, `certFormat`, `certificateNotAfter`, `hasWebhookToken`, `integrationConfigured` | Não (aditivo). **Nunca** vêm ciphertext, path, secret, senha, token ou PEM |
| Upload de certificado | Rota nova multipart | Não (aditivo) |
| Rotate do webhook | Rota nova | Não (aditivo) |
| Nested `bank` em invoice-config / provider-item | Ganha as mesmas flags (sem segredo) | Não (aditivo) |
| Claims CASL | Reusa `BANK_READ` / `BANK_WRITE` | Não |

## Create / edit (JSON)

Campos públicos atuais continuam obrigatórios no create. Integração é opcional: banco sem Inter
continua válido.

| Campo | Create | Edit | Notas |
|---|---|---|---|
| `apiUrl` | opcional | opcional | Até 512 caracteres |
| `clientId` | opcional | omitir = manter | Write-only. GET devolve só `clientIdHint` (últimos 4) |
| `clientSecret` | opcional | omitir = manter | Write-only |
| `webhookToken` | opcional, min 16 | omitir = manter | Write-only. Se `clientId`+`clientSecret` forem gravados sem token, a API **gera** um e devolve em `webhookToken` **só nesta resposta** |

`PATCH` substitui os campos públicos (drawer, wallet, …) como já fazia. Segredos são o único patch
parcial.

## Upload de certificado

`POST /admin/bank/:id/certificate` — `Content-Type: multipart/form-data`, claim `BANK_WRITE`.

XOR: envie **um** dos dois conjuntos, nunca os dois, nunca incompleto:

| Parts | Quando |
|---|---|
| `pfx` + campo `pfxPassword` | PKCS#12 |
| `cert` + `key` | par PEM (.crt + .key) |

Máximo 1 MB por arquivo. Parse inválido ou senha errada → `400` com `message` em pt-BR.

Não usar a rota genérica de upload/S3.

## Token do webhook

A URL pública **não muda**: `POST /webhooks/inter/cobranca/:token` (sem JWT; o Inter é quem posta).

O token deixa de vir do `.env`. Depois do create (se keys foram gravadas) ou de
`POST /admin/bank/:id/webhook-token`, mostre o valor **uma vez** e peça para recadastrar no portal
Inter. GET do banco só diz `hasWebhookToken`.

401 no webhook = token errado (não há banco com esse hash).

## Flags no `BankDto`

Use `integrationConfigured` para o selo “pronto para emitir boleto”. Falta certificado, secret ou
URL → `false`, mesmo com `clientIdHint` preenchido.

`certFormat`: `"PFX"` \| `"PEM_PAIR"` \| `null`.

`certificateNotAfter`: ISO datetime ou `null`. Pode alimentar o mesmo aviso de vencimento do
healthcheck.

## Erros / UX

Contrato `{ message: string }`. Exemplos:

- `400` certificado inválido / XOR dos arquivos / banco sem integração (na emissão de boleto)
- `404` banco inexistente
- `409` banco duplicado (código+agência+conta) ou em uso na exclusão

Não persistir `clientSecret`, `webhookToken` nem `pfxPassword` em log, analytics ou storage local.
O backend mascara esses nomes no audit.

## Checklist

1. Tipar as flags novas de `BankDto` a partir do OpenAPI. Não inventar campos de secret no GET.
2. Form de create/edit: keys opcionais; no edit, input vazio = não alterar.
3. Tela de certificado: `FormData` com `pfx`+`pfxPassword` **ou** `cert`+`key`.
4. Mostrar `webhookToken` só na resposta de create/rotate; copiar e descartar.
5. Mocks E2E: banco sem Inter (`integrationConfigured: false`) vs banco completo (flags true, sem
   ciphertext).
