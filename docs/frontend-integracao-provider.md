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
