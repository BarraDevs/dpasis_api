# Integração frontend — Vendedores (`/admin/seller`)

## Introdução

Novo recurso **Vendedores** para cadastro de vendedores (dados de contato, endereço, comissão e foto de perfil por URL).

**Referência OpenAPI:** Swagger em `/swagger`, tag **Vendedores**.

## Base URL admin

- Prefixo: **`/admin/seller`**
- Autenticação: admin + claims **`SELLER_READ`** e **`SELLER_WRITE`**

## Endpoints

| Método | Path | Claim | Resposta |
|--------|------|-------|----------|
| `POST` | `/admin/seller` | `SELLER_WRITE` | `{ id: number }` |
| `GET` | `/admin/seller` | `SELLER_READ` | Paginação de vendedores |
| `GET` | `/admin/seller/:id` | `SELLER_READ` | Objeto do vendedor |
| `PATCH` | `/admin/seller/:id/activate` | `SELLER_WRITE` | `{ message: string }` |
| `PATCH` | `/admin/seller/:id/deactivate` | `SELLER_WRITE` | `{ message: string }` |
| `PATCH` | `/admin/seller/:id` | `SELLER_WRITE` | `{ message: string }` — body parcial |
| `DELETE` | `/admin/seller/:id` | `SELLER_WRITE` | `{ message: string }` — exclusão física |

A **exclusão** (`DELETE`) remove o registro permanentemente. Para inativar sem excluir, use **desativar** (`PATCH …/deactivate`).

### Query em `GET /admin/seller`

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página (padrão do projeto) |
| `size` | number | Tamanho da página |
| `search` | string | Busca em `name`, `nickname`, `email`, `phone`, `whatsapp` |
| `active` | boolean | Filtra por status ativo/inativo |

### Body de criação (`POST /admin/seller`)

```json
{
  "name": "João Silva",
  "phone": "1133334444",
  "nickname": "João",
  "whatsapp": "11999998888",
  "email": "joao@vendedor.com",
  "commission": 10.5,
  "profilePictureUrl": null,
  "observation": null,
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
| `name` | sim | Nome do vendedor |
| `phone` | sim | Telefone |
| `nickname` | não | Apelido |
| `whatsapp` | sim | WhatsApp |
| `email` | sim | E-mail único no sistema |
| `commission` | sim | Comissão de 0 a 100 (percentual) |
| `profilePictureUrl` | não | URL da foto de perfil (sem upload nesta versão) |
| `observation` | não | Observações |
| `zipCode`, `street`, `number`, `neighborhood`, `city`, `state` | sim | Endereço |
| `complement` | não | Complemento do endereço |

O campo `active` **não** é enviado na criação — o vendedor nasce **ativo** (`true`).

### Body de edição (`PATCH /admin/seller/:id`)

Todos os campos do create são opcionais (`PartialType`).

### Resposta de listagem / detalhe

```json
{
  "id": 1,
  "name": "João Silva",
  "phone": "1133334444",
  "nickname": "João",
  "whatsapp": "11999998888",
  "email": "joao@vendedor.com",
  "commission": 10.5,
  "profilePictureUrl": null,
  "observation": null,
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

## Autorização

| Recurso | Read | Write |
|---------|------|-------|
| Vendedor | `SELLER_READ` | `SELLER_WRITE` |

Subject CASL: `seller` (label na UI de permissões: **Vendedores**).

Admins existentes **não** recebem as claims automaticamente; conceder `seller` + read/write na tela de permissões após deploy.

## Erros (UX)

| Situação | HTTP | `message` (exemplo) |
|----------|------|---------------------|
| Vendedor não encontrado | 404 | Vendedor não encontrado na base de dados. |
| E-mail já em uso | 409 | O e-mail … já está em uso. |
| Comissão inválida (fora de 0–100) | 400 | A comissão deve estar entre 0 e 100: … |
| Validação de campo obrigatório | 400 | Mensagens com `$property` em pt-BR |

## Checklist prático para o frontend

1. Criar tela de listagem consumindo `GET /admin/seller` com paginação, busca e filtro `active`.
2. Formulário de criação/edição com campos obrigatórios; `nickname`, `profilePictureUrl`, `observation` e `complement` opcionais.
3. Ações **Ativar** / **Desativar** via `PATCH …/activate` e `PATCH …/deactivate`.
4. Ação **Excluir** via `DELETE /admin/seller/:id` (exclusão física — confirmar com o usuário).
5. Mapear permissões `SELLER_READ` / `SELLER_WRITE` na navegação e botões.
6. Tratar 409 ao salvar e-mail duplicado e exibir `message` da API.
7. Regenerar tipos a partir do Swagger (`/swagger`) após deploy.
