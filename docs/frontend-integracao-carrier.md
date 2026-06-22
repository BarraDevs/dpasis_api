# Integração frontend — Transportadoras (`/admin/carrier`)

## Introdução

Novo recurso **Transportadoras** para cadastro de empresas transportadoras (razão social, endereço, documento, representante e contato).

**Referência OpenAPI:** Swagger em `/swagger`, tag **Transportadoras**.

## Base URL admin

- Prefixo: **`/admin/carrier`**
- Autenticação: admin + claims **`CARRIER_READ`** e **`CARRIER_WRITE`**

## Endpoints

| Método | Path | Claim | Resposta |
|--------|------|-------|----------|
| `POST` | `/admin/carrier` | `CARRIER_WRITE` | `{ id: number }` |
| `GET` | `/admin/carrier` | `CARRIER_READ` | Paginação de transportadoras |
| `GET` | `/admin/carrier/:id` | `CARRIER_READ` | Objeto da transportadora |
| `PATCH` | `/admin/carrier/:id/activate` | `CARRIER_WRITE` | `{ message: string }` |
| `PATCH` | `/admin/carrier/:id/deactivate` | `CARRIER_WRITE` | `{ message: string }` |
| `PATCH` | `/admin/carrier/:id` | `CARRIER_WRITE` | `{ message: string }` — body parcial |
| `DELETE` | `/admin/carrier/:id` | `CARRIER_WRITE` | `{ message: string }` |

Exclusão é **física** (remove o registro). Para apenas inativar, use `PATCH …/deactivate`.

### Query em `GET /admin/carrier`

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página (padrão do projeto) |
| `size` | number | Tamanho da página |
| `search` | string | Busca em `name`, `fantasyName`, `document`, `representative` |
| `active` | boolean | Filtra por status ativo/inativo |

### Body de criação (`POST /admin/carrier`)

```json
{
  "name": "Transportadora LTDA",
  "fantasyName": "Transportadora",
  "representative": "João Silva",
  "document": "09.748.165/0001-10",
  "contact": "João Silva - (11) 99999-9999",
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
| `fantasyName` | sim | Nome fantasia |
| `representative` | sim | Nome do representante |
| `document` | sim | CPF ou CNPJ (único no sistema) |
| `contact` | sim | Texto livre (telefone, e-mail ou ambos) |
| `zipCode`, `street`, `number`, `neighborhood`, `city`, `state` | sim | Endereço |
| `complement` | não | Complemento do endereço |

### Body de edição (`PATCH /admin/carrier/:id`)

Todos os campos do create são opcionais (`PartialType`).

### Resposta de listagem / detalhe

```json
{
  "id": 1,
  "name": "Transportadora LTDA",
  "fantasyName": "Transportadora",
  "representative": "João Silva",
  "document": "09748165000110",
  "contact": "João Silva - (11) 99999-9999",
  "active": true,
  "zipCode": "01310100",
  "street": "Av Paulista",
  "number": "1000",
  "complement": null,
  "neighborhood": "Bela Vista",
  "city": "São Paulo",
  "state": "SP",
  "createdAt": "2026-06-22T12:00:00.000Z",
  "updatedAt": "2026-06-22T12:00:00.000Z"
}
```

O `document` é persistido sem máscara (apenas dígitos).

## Autorização

| Recurso | Read | Write |
|---------|------|-------|
| Transportadora | `CARRIER_READ` | `CARRIER_WRITE` |

Subject CASL: `carrier` (label na UI de permissões: **Transportadoras**).

Admins existentes **não** recebem as claims automaticamente; conceder `carrier` + read/write na tela de permissões após deploy.

## Erros (UX)

| Situação | HTTP | `message` (exemplo) |
|----------|------|---------------------|
| Transportadora não encontrada | 404 | Transportadora não encontrada na base de dados. |
| Documento já em uso | 409 | O documento … já está em uso. |
| Documento inválido (CPF/CNPJ) | 400 | Mensagem do validador de documento |
| Validação de campo obrigatório | 400 | Mensagens com `$property` em pt-BR |

## Checklist prático para o frontend

1. Criar tela de listagem consumindo `GET /admin/carrier` com paginação, busca e filtro `active`.
2. Formulário de criação/edição com todos os campos obrigatórios; `complement` opcional.
3. Ações **Ativar** / **Desativar** via `PATCH …/activate` e `PATCH …/deactivate`; **Excluir** via `DELETE /admin/carrier/:id` (com confirmação na UI).
4. Mapear permissões `CARRIER_READ` / `CARRIER_WRITE` na navegação e botões.
5. Tratar 409 ao salvar documento duplicado e exibir `message` da API.
6. Regenerar tipos a partir do Swagger (`/swagger`) após deploy.
