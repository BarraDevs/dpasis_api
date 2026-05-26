# Integração frontend — Data de cadastro do cliente (`createdAt`)

## Introdução

O cadastro de cliente (`POST /admin/client`) passa a aceitar **`createdAt` opcional** para importar ou alinhar a data de cadastro legada. O campo **não pode ser alterado** após a criação (não existe no body de edição).

**Referência OpenAPI:** Swagger em `/swagger`, tag **Clientes**.

## Base URL admin

- Prefixo: **`/admin/client`**
- Autenticação: admin + claims **`CLIENT_READ`** / **`CLIENT_WRITE`**

## Resumo das mudanças

| Área | Antes | Depois |
|------|--------|--------|
| `POST /admin/client` | `createdAt` definido só pelo servidor (`now()`) | Campo opcional **`createdAt`** no body (`yyyy-mm-dd`) |
| `PATCH /admin/client/:id` | — | **`createdAt` não faz parte do contrato** (ignorado pelo whitelist se enviado) |
| Respostas de leitura | `createdAt` em `ClientDto` | **Sem mudança** |

## `POST /admin/client` — body

Campo **opcional** (adicional aos demais campos já existentes):

| Campo | Tipo | Formato | Descrição |
|-------|------|---------|-----------|
| `createdAt` | `string` | `yyyy-mm-dd` | Data de cadastro legada. Ex.: `"2020-03-15"`. Se omitido, o servidor usa a data/hora atual. |

### Semântica de timezone

A API interpreta a string como **início do dia em UTC**:

- `"2020-03-15"` → `2020-03-15T00:00:00.000Z` no banco
- Não enviar hora (`2020-03-15T10:00:00.000Z` é **rejeitado** na validação)

### Exemplo (trecho)

```json
{
  "type": "PJ",
  "document": "09.748.165/0001-10",
  "groupId": 1,
  "resaleId": 1,
  "companyIds": [1],
  "companyName": "Empresa LTDA",
  "headquarters": "São Paulo",
  "invoiceType": "CONTRACT",
  "generateInvoice": true,
  "parentClientId": null,
  "createdAt": "2020-03-15",
  "address": { "...": "..." }
}
```

## `PATCH /admin/client/:id`

- **Não enviar** `createdAt` no body de edição.
- O valor persistido na criação permanece inalterado.
- Se o campo for enviado por engano, o `ValidationPipe` (whitelist) **remove** a propriedade — não atualiza o registro.

## Autorização

| Recurso | Read | Write |
|---------|------|-------|
| Cliente | `CLIENT_READ` | `CLIENT_WRITE` |

Sem novas claims.

## Erros (UX)

| Situação | HTTP | `message` (exemplo) |
|----------|------|---------------------|
| Formato inválido (`03/15/2020`, `2020-3-5`, ISO com hora) | 400 | `$property deve estar no formato yyyy-mm-dd` |
| Data inválida (`2020-02-30`) | 400 | `$property deve ser uma data válida` |

Exibir sempre o `message` retornado pela API.

## Checklist prático para o frontend

1. Exibir seletor de **data de cadastro** apenas no fluxo de **criação** de cliente (não na edição).
2. Enviar `createdAt` como string `yyyy-mm-dd` (sem hora/fuso no payload).
3. Omitir o campo quando o usuário não informar data legada (comportamento atual: data do servidor).
4. Atualizar tipos gerados a partir do OpenAPI (`CreateClientInputDto.createdAt?`).
5. Manter exibição de `createdAt` nas telas de detalhe/listagem como `Date` já retornado pela API.
6. Filtros avançados de busca por `createdAt` (search) permanecem como estavam — sem mudança nesta entrega.
