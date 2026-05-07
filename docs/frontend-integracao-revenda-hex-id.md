# Integração frontend — IDs de revenda em hexadecimal (admin)

## Introdução

Este documento descreve a mudança de contrato nas rotas admin de **revenda** (`/admin/resale`) e **contatos de revenda** (`/admin/resale-contact`): identificadores da entidade **Resale** passam a ser tratados como **strings em hexadecimal** (1 a 8 caracteres `0-9`/`A-F`, prefixo `0x` opcional) na API HTTP. No banco continuam como inteiros; apenas a camada HTTP faz a conversão.

**Escopo:** PK de revenda em path, corpo e respostas; FK `resaleId` em listagem e criação de contatos; próximo ID da sequência (`GET/PATCH .../sequence`).

**Não muda:** `id` de **contato** ou **departamento** em `/admin/resale-contact/:id` e `/admin/resale-department/:id` — permanecem **números decimais** (string numérica na URL, como antes).

## Base URL admin

Prefixo típico: `/admin/resale`, `/admin/resale-contact`. Requer autenticação admin e as claims já existentes (`RESALE_READ` / `RESALE_WRITE`, `RESALE_CONTACT_READ` / `RESALE_CONTACT_WRITE`).

## Resumo das mudanças

| Área | Antes | Depois |
|------|--------|--------|
| Path `GET/PATCH /admin/resale/:id` | `:id` decimal (ex.: `67`) | `:id` hex (ex.: `43` para decimal 67) |
| Corpo `POST/PATCH` revenda (`id` opcional) | número | string hex |
| Resposta `Resale`, lista paginada, `POST` create | `id: number` | `id: string` (hex maiúsculo) |
| `GET /admin/resale/sequence` | `{ nextId: number }` | `{ nextId: string }` |
| `PATCH /admin/resale/sequence` | `{ nextId: number }` | `{ nextId: string }` |
| Query `GET /admin/resale-contact?resaleId=` | resaleId decimal | resaleId string hex |
| Body `POST /admin/resale-contact` | `resaleId: number` | `resaleId: string` |
| Resposta contato (`resaleId`) | número | string hex |

## Detalhe por endpoint

### Revenda (`/admin/resale`)

- **Path `id`:** sempre interpretado como unsigned 32 bits em hex (ex.: revenda decimal `100` → path `64`).
- **`POST` multipart:** campo opcional `id` (string hex), mesmo padrão de validação.
- **Mensagens de erro:** textos que citam ID de revenda passam a exibir o valor em **hex** (ex.: conflito de ID `409`, sequência inválida `422`).

### Contatos (`/admin/resale-contact`)

- **`resaleId`** obrigatório na query de listagem e no body de criação: formato hex como acima.
- **`GET :id` / `PATCH` / `DELETE`:** o `:id` do **contato** segue sendo **inteiro decimal** na URL (sem reformatar para hex).

## Validação (400)

Mensagem típica ao enviar ID inválido:

`Valor hexadecimal inválido. Informe de 1 a 8 caracteres usando apenas 0-9 e A-F (opcionalmente prefixo 0x).`

## Checklist frontend

1. Tipar `id` de revenda e `resaleId` em DTOs de contato como **`string`** onde forem IDs de revenda.
2. Ajustar rotas e query params: não usar `toString()` decimal para path de revenda; usar representação hex acordada com o backend (hex uppercase na resposta).
3. Atualizar mocks e testes E2E para paths e query `resaleId` em hex.
4. Revisar Swagger gerado (`ResaleWireSwaggerDto`, `ResaleContactWireSwaggerDto`) para os tipos atualizados.
