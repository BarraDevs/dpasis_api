# Integração frontend — Prestadores (`/admin/provider`)

## Introdução

Recurso **Prestadores** para cadastro de prestadores de serviço (dados cadastrais e endereço).

**Referência OpenAPI:** Swagger em `/swagger`, tag **Prestadores**.

## Resumo das mudanças (breaking)

| Área | Antes | Depois |
|------|-------|--------|
| Campos de cobrança | `type`, `valueInCents`, `paymentDate`, `deadline` no create/edit/resposta | **Removidos** — prestador é apenas cadastro |
| Validação condicional | Obrigatório `deadline` (ONE_OFF) ou `paymentDate` (RECURRING) | **Removida** |
| Demais campos | `name`, `document`, `ie`, `fantasyName`, `email`, `website`, endereço, `active` | **Inalterados** |

O frontend deve **parar de enviar e exibir** `type`, `valueInCents`, `paymentDate` e `deadline`.

## Base URL admin

- Prefixo: **`/admin/provider`**
- Autenticação: admin + claims **`PROVIDER_READ`** e **`PROVIDER_WRITE`**

## Endpoints

| Método | Path | Claim | Resposta |
|--------|------|-------|----------|
| `POST` | `/admin/provider` | `PROVIDER_WRITE` | `{ id: number }` |
| `GET` | `/admin/provider` | `PROVIDER_READ` | Paginação de prestadores |
| `GET` | `/admin/provider/:id` | `PROVIDER_READ` | Objeto do prestador |
| `PATCH` | `/admin/provider/:id/activate` | `PROVIDER_WRITE` | `{ message: string }` |
| `PATCH` | `/admin/provider/:id/deactivate` | `PROVIDER_WRITE` | `{ message: string }` |
| `PATCH` | `/admin/provider/:id` | `PROVIDER_WRITE` | `{ message: string }` — body parcial |
| `DELETE` | `/admin/provider/:id` | `PROVIDER_WRITE` | `{ message: string }` |

Exclusão é **física** (remove o registro). Para apenas inativar, use `PATCH …/deactivate`.

### Query em `GET /admin/provider`

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página (padrão do projeto) |
| `size` | number | Tamanho da página |
| `search` | string | Busca em `name`, `fantasyName`, `document`, `email` |
| `active` | boolean | Filtra por status ativo/inativo |

### Body de criação (`POST /admin/provider`)

```json
{
  "name": "Prestador LTDA",
  "document": "09.748.165/0001-10",
  "ie": null,
  "fantasyName": "Prestador",
  "email": "contato@prestador.com",
  "website": "https://prestador.com",
  "zipCode": "01310100",
  "street": "Av Paulista",
  "number": "1000",
  "complement": null,
  "neighborhood": "Bela Vista",
  "city": "São Paulo",
  "state": "SP"
}
```

| Campo | Obrigatório | Observação |
|-------|-------------|------------|
| `name` | sim | Razão social |
| `document` | sim | CPF ou CNPJ (único no sistema) |
| `ie` | não | Inscrição estadual |
| `fantasyName` | sim | Nome fantasia |
| `email` | sim | E-mail único no sistema |
| `website` | sim | Site |
| `zipCode`, `street`, `number`, `neighborhood`, `city`, `state` | sim | Endereço |
| `complement` | não | Complemento |

### Body de edição (`PATCH /admin/provider/:id`)

Todos os campos do create são opcionais (`PartialType`).

### Resposta de listagem / detalhe

```json
{
  "id": 1,
  "name": "Prestador LTDA",
  "document": "09748165000110",
  "ie": null,
  "fantasyName": "Prestador",
  "email": "contato@prestador.com",
  "website": "https://prestador.com",
  "active": true,
  "zipCode": "01310100",
  "street": "Av Paulista",
  "number": "1000",
  "complement": null,
  "neighborhood": "Bela Vista",
  "city": "São Paulo",
  "state": "SP",
  "createdAt": "2026-06-23T12:00:00.000Z",
  "updatedAt": "2026-06-23T12:00:00.000Z"
}
```

## Autenticação e claims

| Recurso | Leitura | Escrita |
|---------|---------|---------|
| Prestadores | `PROVIDER_READ` | `PROVIDER_WRITE` |

## Erros comuns

| Status | Quando |
|--------|--------|
| `400` | Validação de DTO |
| `404` | Prestador não encontrado |
| `409` | `document` ou `email` já em uso |

Exibir `message` do payload de erro ao usuário.

## Checklist prático para o frontend

1. Gerar tipos a partir do Swagger (`/swagger`, tag **Prestadores**).
2. Remover do formulário: `type`, `valueInCents`, `paymentDate`, `deadline`.
3. Tratar `409` em `document` e `email` com feedback específico.
4. Garantir que o admin logado possui `PROVIDER_READ` / `PROVIDER_WRITE` nas claims.
5. Listagem: suportar `search` e filtro `active`.

---

# Integração frontend — Itens de prestador (`/admin/provider-item`)

## Introdução

Recurso **Itens de prestador** vincula um prestador a um item com valor total parcelado, regras de vencimento e conta bancária. Na criação, a API gera automaticamente N parcelas com status `Pendente`.

**Referência OpenAPI:** Swagger em `/swagger`, tag **Prestadores - Itens**.

## Base URL admin

- Prefixo: **`/admin/provider-item`**
- Autenticação: admin + claims **`PROVIDER_ITEM_READ`** e **`PROVIDER_ITEM_WRITE`**

## Endpoints

| Método | Path | Claim | Resposta |
|--------|------|-------|----------|
| `POST` | `/admin/provider-item` | `PROVIDER_ITEM_WRITE` | `{ id: number }` |
| `GET` | `/admin/provider-item` | `PROVIDER_ITEM_READ` | Paginação de itens |
| `GET` | `/admin/provider-item/:id` | `PROVIDER_ITEM_READ` | Objeto do item com `installments[]` |
| `PATCH` | `/admin/provider-item/:id/installments/:installmentId/pay` | `PROVIDER_ITEM_WRITE` | `{ message: string }` |
| `PATCH` | `/admin/provider-item/:id/activate` | `PROVIDER_ITEM_WRITE` | `{ message: string }` |
| `PATCH` | `/admin/provider-item/:id/deactivate` | `PROVIDER_ITEM_WRITE` | `{ message: string }` |
| `PATCH` | `/admin/provider-item/:id` | `PROVIDER_ITEM_WRITE` | `{ message: string }` — body parcial |
| `DELETE` | `/admin/provider-item/:id` | `PROVIDER_ITEM_WRITE` | `{ message: string }` |

### Query em `GET /admin/provider-item`

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `providerId` | number | **Obrigatório** — filtra itens do prestador |
| `page` | number | Página (padrão do projeto) |
| `size` | number | Tamanho da página |
| `search` | string | Busca em `description` |
| `active` | boolean | Filtra por status ativo/inativo |

### Body de criação (`POST /admin/provider-item`)

```json
{
  "providerId": 1,
  "description": "Serviço de manutenção",
  "totalValueInCents": 100000,
  "installmentsCount": 3,
  "scheduleType": "Em dias",
  "intervalDays": 30,
  "dueDay": null,
  "firstDueDate": "2026-07-10",
  "bankId": 1
}
```

| Campo | Obrigatório | Observação |
|-------|-------------|------------|
| `providerId` | sim | FK do prestador |
| `description` | sim | Descrição do item |
| `totalValueInCents` | sim | Valor total em centavos |
| `installmentsCount` | sim | Número de parcelas (≥ 1) |
| `scheduleType` | sim | `"Em dias"` ou `"Dia de vencimento"` |
| `intervalDays` | condicional | Obrigatório quando `scheduleType` = `"Em dias"` |
| `dueDay` | condicional | Obrigatório (1–31) quando `scheduleType` = `"Dia de vencimento"` |
| `firstDueDate` | sim | Data âncora ISO (`YYYY-MM-DD`) para calcular vencimentos |
| `bankId` | sim | Conta bancária ativa |

Exemplo para **Dia de vencimento**:

```json
{
  "providerId": 1,
  "description": "Aluguel",
  "totalValueInCents": 50000,
  "installmentsCount": 12,
  "scheduleType": "Dia de vencimento",
  "intervalDays": null,
  "dueDay": 10,
  "firstDueDate": "2026-07-10",
  "bankId": 1
}
```

### Body de edição (`PATCH /admin/provider-item/:id`)

Todos os campos do create são opcionais, exceto `providerId` (não enviável). Ao alterar valor, quantidade de parcelas ou regra de vencimento, **apenas parcelas com status `Pendente` são recalculadas**; parcelas `Paga` permanecem inalteradas.

### Resposta de listagem / detalhe

```json
{
  "id": 1,
  "providerId": 1,
  "description": "Serviço de manutenção",
  "totalValueInCents": 100000,
  "installmentsCount": 3,
  "scheduleType": "Em dias",
  "intervalDays": 30,
  "dueDay": null,
  "firstDueDate": "2026-07-10T00:00:00.000Z",
  "bankId": 1,
  "bank": {
    "id": 1,
    "drawer": "Empresa XYZ",
    "wallet": "123",
    "account": "12345-6",
    "agency": "0001",
    "bankCode": "001",
    "bankName": "Banco do Brasil",
    "paymentLocation": null,
    "active": true,
    "createdAt": "2026-06-23T12:00:00.000Z",
    "updatedAt": "2026-06-23T12:00:00.000Z"
  },
  "active": true,
  "installments": [
    {
      "id": 10,
      "number": 1,
      "valueInCents": 33333,
      "dueDate": "2026-07-10T00:00:00.000Z",
      "status": "Pendente"
    },
    {
      "id": 11,
      "number": 2,
      "valueInCents": 33333,
      "dueDate": "2026-08-09T00:00:00.000Z",
      "status": "Paga"
    },
    {
      "id": 12,
      "number": 3,
      "valueInCents": 33334,
      "dueDate": "2026-09-08T00:00:00.000Z",
      "status": "Pendente"
    }
  ],
  "createdAt": "2026-06-23T12:00:00.000Z",
  "updatedAt": "2026-06-23T12:00:00.000Z"
}
```

### Status das parcelas

| Valor API | Significado |
|-----------|-------------|
| `Pendente` | Parcela em aberto |
| `Paga` | Parcela quitada (via `PATCH …/installments/:installmentId/pay`) |

## Autenticação e claims

| Recurso | Leitura | Escrita |
|---------|---------|---------|
| Itens de prestador | `PROVIDER_ITEM_READ` | `PROVIDER_ITEM_WRITE` |

## Erros comuns

| Status | Quando |
|--------|--------|
| `400` | Validação de DTO ou regra de negócio (ex.: valor total menor que soma das parcelas pagas) |
| `404` | Item ou parcela não encontrados |
| `409` | Parcela já está paga |

## Checklist prático para o frontend

1. Gerar tipos a partir do Swagger (tag **Prestadores - Itens**).
2. Na listagem, sempre enviar `providerId` na query.
3. Formulário: alternar campos `intervalDays` / `dueDay` conforme `scheduleType`.
4. Exibir `installments[]` ordenadas por `number` com badge de status.
5. Usar `PATCH …/pay` para marcar parcela como paga.
6. Garantir claims `PROVIDER_ITEM_READ` / `PROVIDER_ITEM_WRITE` no admin.
