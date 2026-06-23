# Integração frontend — Prestadores (`/admin/provider`)

## Introdução

Novo recurso **Prestadores** para cadastro de prestadores de serviço (dados cadastrais, endereço, valor, tipo de cobrança avulsa ou recorrente).

**Referência OpenAPI:** Swagger em `/swagger`, tag **Prestadores**.

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

### Enum `type`

| Valor API | Significado |
|-----------|-------------|
| `ONE_OFF` | Avulso |
| `RECURRING` | Recorrente |

### Campos condicionais por `type`

| Campo | `ONE_OFF` | `RECURRING` |
|-------|-----------|-------------|
| `deadline` | **Obrigatório** — quantidade de dias (> 0) | Deve ser omitido ou `null` |
| `paymentDate` | Deve ser omitido ou `null` | **Obrigatório** — dia do mês (1–31) |

### Body de criação (`POST /admin/provider`) — exemplo `ONE_OFF`

```json
{
  "name": "Prestador LTDA",
  "type": "ONE_OFF",
  "valueInCents": 150000,
  "document": "09.748.165/0001-10",
  "ie": null,
  "deadline": 30,
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

### Body de criação — exemplo `RECURRING`

```json
{
  "name": "Prestador Recorrente LTDA",
  "type": "RECURRING",
  "valueInCents": 250000,
  "document": "33.000.167/0001-01",
  "ie": "123456789",
  "paymentDate": 15,
  "fantasyName": "Prestador Recorrente",
  "email": "recorrente@prestador.com",
  "website": "https://prestador.com",
  "zipCode": "01310100",
  "street": "Av Paulista",
  "number": "1000",
  "complement": "Sala 1",
  "neighborhood": "Bela Vista",
  "city": "São Paulo",
  "state": "SP"
}
```

| Campo | Obrigatório | Observação |
|-------|-------------|------------|
| `name` | sim | Razão social |
| `type` | sim | `ONE_OFF` ou `RECURRING` |
| `valueInCents` | sim | Valor em centavos (≥ 0) |
| `document` | sim | CPF ou CNPJ (único no sistema) |
| `ie` | não | Inscrição estadual |
| `deadline` | condicional | Obrigatório se `type = ONE_OFF` |
| `paymentDate` | condicional | Obrigatório se `type = RECURRING` (1–31) |
| `fantasyName` | sim | Nome fantasia |
| `email` | sim | E-mail único no sistema |
| `website` | sim | Site |
| `zipCode`, `street`, `number`, `neighborhood`, `city`, `state` | sim | Endereço |
| `complement` | não | Complemento |

### Body de edição (`PATCH /admin/provider/:id`)

Todos os campos do create são opcionais (`PartialType`). Ao alterar `type`, enviar também o campo condicional correspondente (`deadline` ou `paymentDate`).

### Resposta de listagem / detalhe

```json
{
  "id": 1,
  "name": "Prestador LTDA",
  "type": "ONE_OFF",
  "valueInCents": 150000,
  "document": "09748165000110",
  "ie": null,
  "paymentDate": null,
  "deadline": 30,
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
| `400` | Validação de DTO ou campos condicionais inválidos para o `type` |
| `404` | Prestador não encontrado |
| `409` | `document` ou `email` já em uso |

Exibir `message` do payload de erro ao usuário.

## Checklist prático para o frontend

1. Gerar tipos a partir do Swagger (`/swagger`, tag **Prestadores**).
2. Formulário com toggle/select `type` e exibição condicional de `deadline` vs `paymentDate`.
3. Enviar `valueInCents` como inteiro (centavos).
4. Tratar `409` em `document` e `email` com feedback específico.
5. Garantir que o admin logado possui `PROVIDER_READ` / `PROVIDER_WRITE` nas claims.
6. Listagem: suportar `search` e filtro `active`.
