# Integração frontend — Vendedores (`/admin/seller`)

## Introdução

Recurso **Vendedores** para cadastro de vendedores (dados de contato, endereço, comissão e foto de perfil).

**Referência OpenAPI:** Swagger em `/swagger`, tag **Vendedores**.

## Base URL admin

- Prefixo: **`/admin/seller`**
- Autenticação: admin + claims **`SELLER_READ`** e **`SELLER_WRITE`**

## Resumo das mudanças (breaking)

| Área | Antes | Depois |
|------|-------|--------|
| `POST /admin/seller` | `application/json` | **`multipart/form-data`** |
| `PATCH /admin/seller/:id` | `application/json` | **`multipart/form-data`** |
| Foto de perfil | campo `profilePictureUrl` no body | part **`file`** (upload opcional) |
| Resposta de leitura | — | `profilePictureUrl` continua vindo em GET/listagem |

## Endpoints

| Método | Path | Claim | Content-Type | Resposta |
|--------|------|-------|--------------|----------|
| `POST` | `/admin/seller` | `SELLER_WRITE` | `multipart/form-data` | `{ id: number }` |
| `GET` | `/admin/seller` | `SELLER_READ` | — | Paginação de vendedores |
| `GET` | `/admin/seller/:id` | `SELLER_READ` | — | Objeto do vendedor |
| `PATCH` | `/admin/seller/:id/activate` | `SELLER_WRITE` | — | `{ message: string }` |
| `PATCH` | `/admin/seller/:id/deactivate` | `SELLER_WRITE` | — | `{ message: string }` |
| `PATCH` | `/admin/seller/:id` | `SELLER_WRITE` | `multipart/form-data` | `{ message: string }` — body parcial |
| `DELETE` | `/admin/seller/:id` | `SELLER_WRITE` | — | `{ message: string }` — exclusão física |

A **exclusão** (`DELETE`) remove o registro permanentemente e enfileira remoção da foto no storage (se existir). Para inativar sem excluir, use **desativar** (`PATCH …/deactivate`).

### Query em `GET /admin/seller`

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página (padrão do projeto) |
| `size` | number | Tamanho da página |
| `search` | string | Busca em `name`, `nickname`, `email`, `phone`, `whatsapp` |
| `active` | boolean | Filtra por status ativo/inativo |

### Create / Edit — `multipart/form-data`

**Parts de texto** (mesmos nomes dos campos):

| Campo | Obrigatório (create) | Observação |
|-------|----------------------|------------|
| `name` | sim | Nome do vendedor |
| `phone` | sim | Telefone |
| `nickname` | não | Apelido |
| `whatsapp` | sim | WhatsApp |
| `email` | sim | E-mail único no sistema |
| `commission` | sim | Comissão 0–100 (enviar como string no FormData, ex.: `"10.5"`) |
| `observation` | não | Observações |
| `zipCode`, `street`, `number`, `neighborhood`, `city`, `state` | sim | Endereço |
| `complement` | não | Complemento |

**Part de arquivo:**

| Campo | Obrigatório | Observação |
|-------|-------------|------------|
| `file` | não | Foto de perfil — JPEG, PNG ou WebP, até 20 MB |

O campo `active` **não** é enviado na criação — o vendedor nasce **ativo** (`true`).

**Exemplo JavaScript:**

```javascript
const form = new FormData();
form.append('name', 'João Silva');
form.append('phone', '1133334444');
form.append('whatsapp', '11999998888');
form.append('email', 'joao@vendedor.com');
form.append('commission', '10.5');
form.append('zipCode', '01310100');
form.append('street', 'Av Paulista');
form.append('number', '1000');
form.append('neighborhood', 'Bela Vista');
form.append('city', 'São Paulo');
form.append('state', 'SP');
if (photoFile) {
  form.append('file', photoFile);
}

await fetch('/admin/seller', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: form,
});
```

Na **edição**, todos os campos textuais são opcionais; envie apenas o que mudou. Para trocar a foto, envie um novo `file` — a URL anterior é substituída e removida do storage em background.

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
  "profilePictureUrl": "https://cdn.example.com/sellers/1/profile-picture/photo.png",
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

`profilePictureUrl` é **somente leitura** — preenchido pelo backend após upload.

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
| Arquivo ausente quando obrigatório | 422 | Mensagem do `RequiredFileError` |
| Arquivo grande demais | 400 | Mensagem do `FileTooBigError` |
| MIME inválido | 400 | Mensagem do `InvalidFileError` |
| Validação de campo obrigatório | 400 | Mensagens com `$property` em pt-BR |

## Checklist prático para o frontend

1. Migrar create/edit de JSON para **`FormData`** (`Content-Type` automático — não setar manualmente).
2. Enviar foto no part **`file`**; remover `profilePictureUrl` do body de create/edit.
3. Enviar `commission` como string numérica no FormData.
4. Exibir `profilePictureUrl` retornado em GET/listagem para preview da foto.
5. Ações **Ativar** / **Desativar** continuam JSON-free (PATCH sem body).
6. **Excluir** via `DELETE /admin/seller/:id` (confirmar com usuário — exclusão física).
7. Mapear permissões `SELLER_READ` / `SELLER_WRITE` na navegação e botões.
8. Regenerar tipos a partir do Swagger (`/swagger`) após deploy.
