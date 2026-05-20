# Integração frontend — Departamento global (`/admin/department`)

## Introdução

Os catálogos **Departamentos de cliente** (`/admin/client-department`) e **Departamentos de revenda** (`/admin/resale-department`) foram unificados em um único recurso global **`/admin/department`**.

Contatos de cliente e de revenda continuam usando o campo **`departmentId`** no body (create/edit); apenas o catálogo e as rotas de manutenção mudaram.

**Referência OpenAPI:** Swagger em `/swagger`, tag **Departamentos**.

## Base URL admin

- Prefixo: **`/admin/department`**
- Autenticação: admin + claims **`DEPARTMENT_READ`** e **`DEPARTMENT_WRITE`**

## Resumo das mudanças (breaking)

| Área | Antes | Depois |
|------|--------|--------|
| Listagem / CRUD de departamentos | `GET/POST/PATCH/DELETE` em `/admin/client-department` ou `/admin/resale-department` | **`/admin/department`** |
| Claims CASL | `CLIENT_DEPARTMENT_*` e `RESALE_DEPARTMENT_*` | **`DEPARTMENT_READ`**, **`DEPARTMENT_WRITE`** (subject `department`) |
| IDs persistidos | IDs distintos por catálogo (cliente vs revenda) | **Novos IDs** após migração — não reutilizar IDs antigos |
| Contatos | `departmentId` em `POST/PATCH` de contatos | **Sem mudança de campo** — validação contra o catálogo global |

## Endpoints — departamentos

| Método | Path | Claim | Resposta |
|--------|------|-------|----------|
| `POST` | `/admin/department` | `DEPARTMENT_WRITE` | `{ id: number }` |
| `GET` | `/admin/department` | `DEPARTMENT_READ` | Paginação de `{ id, name, active, createdAt, updatedAt }` |
| `GET` | `/admin/department/:id` | `DEPARTMENT_READ` | Objeto do departamento |
| `PATCH` | `/admin/department/:id/status` | `DEPARTMENT_WRITE` | `{ message: string }` — inverte `active` |
| `PATCH` | `/admin/department/:id` | `DEPARTMENT_WRITE` | `{ message: string }` — body parcial `{ name?: string }` |
| `DELETE` | `/admin/department/:id` | `DEPARTMENT_WRITE` | `{ message: string }` |

### Query em `GET /admin/department`

Mesmo padrão dos outros catálogos globais: `page`, `size`, `search` (nome), `active` (boolean).

### Body de criação

```json
{ "name": "Comercial" }
```

## Contatos (cliente e revenda)

| Recurso | Rotas de contato | Campo |
|---------|------------------|--------|
| Cliente | `/admin/client-contact` (inalterado) | `departmentId` obrigatório no create |
| Revenda | `/admin/resale-contact` (inalterado) | `departmentId` obrigatório no create |

O select de departamento na UI deve consumir **`GET /admin/department`** (filtro `active=true` quando aplicável), não mais os endpoints antigos por contexto.

## Autorização

| Recurso | Read | Write |
|---------|------|-------|
| Departamento global | `DEPARTMENT_READ` | `DEPARTMENT_WRITE` |
| Contato de cliente | `CLIENT_CONTACT_READ` | `CLIENT_CONTACT_WRITE` |
| Contato de revenda | `RESALE_CONTACT_READ` | `RESALE_CONTACT_WRITE` |

Remover do app admin permissões baseadas em `client-department` / `resale-department` e mapear telas de cadastro de departamento para `department`.

Após deploy, reexecutar seed de claims dos admins (ou conceder manualmente `department` + read/write) para contas que mantinham só as claims antigas.

## Erros (UX)

| Situação | HTTP | `message` (exemplo) |
|----------|------|---------------------|
| Departamento não encontrado | 404 | Departamento não encontrado na base de dados. |
| Nome duplicado | 409 | Já existe um departamento com o nome: … |
| Excluir com contatos vinculados | 409 | Não é possível excluir o departamento pois existem contatos vinculados. |
| Atribuir departamento inativo em contato | 404 | Mesmo erro de não encontrado |

## Migração de dados (backend / ops)

Em ambientes com dados nas tabelas antigas, executar o script [`prisma/scripts/migrate-departments.sql`](../prisma/scripts/migrate-departments.sql) **antes** de `npm run db:migration` (`prisma db push`). Nomes iguais em cliente e revenda viram **um** departamento; `departmentId` dos contatos é remapeado.

## Checklist prático para o frontend

1. Substituir chamadas a `/admin/client-department` e `/admin/resale-department` por `/admin/department`.
2. Atualizar matriz de permissões: `DEPARTMENT_READ` / `DEPARTMENT_WRITE`.
3. Atualizar selects de departamento em formulários de contato (cliente e revenda) para a lista global.
4. Invalidar cache local de IDs de departamento após deploy (IDs mudam).
5. Ajustar mocks E2E e coleção Postman interna, se houver.
