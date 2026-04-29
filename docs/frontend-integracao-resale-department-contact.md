# Integração frontend — departamentos e contatos de revenda (`ResaleDepartment` / `ResaleContact`)

Este documento descreve os **novos recursos administrativos** para catálogo global de **departamentos de revenda** e para **contatos vinculados a uma revenda** (`Resale`). O desenho espelha [`src/app/client/client-department`](../src/app/client/client-department) e [`src/app/client/client-contact`](../src/app/client/client-contact) no backend: mesma divisão de responsabilidades, claims dedicadas e contratos análogos aos de cliente.

O vínculo do **cliente** com a revenda continua documentado em [frontend-integracao-cliente-resale.md](./frontend-integracao-cliente-resale.md).

**Base URL admin:** rotas sob `…/admin/resale-department` e `…/admin/resale-contact` (papel **ADMIN** + claims indicadas abaixo).

---

## 1. Modelagem (visão para o frontend)

| Conceito | Comportamento |
|----------|----------------|
| **Departamento** | Lista **global** ao sistema: não possui `resaleId`. Nome é **único** em toda a base (`ResaleDepartment.name`). |
| **Contato** | Pertence a **uma revenda** (`resaleId`) e a **um departamento** (`departmentId`). E-mail é **único por revenda**: não pode repetir o mesmo e-mail para a mesma `resaleId`. |
| **Ativação** | Departamento: campo `active` + rota que **inverte** o status. Contato: rotas explícitas **ativar** / **desativar** (sem espelhar o toggle único de departamento). |

Para detalhes de implementação e ordem de `truncate`/FKs, ver o plano interno em [`.cursor/plans/resale_contact_e_department_dce61940.plan.md`](../.cursor/plans/resale_contact_e_department_dce61940.plan.md).

---

## 2. Autenticação e claims (CASL)

Todas as rotas exigem **`AccountRole.ADMIN`** e uma das permissões abaixo (via `@RequiredClaims`), alinhadas ao seed de `AccountClaim` / assuntos `resale-department` e `resale-contact`.

| Recurso | Leitura (GET) | Escrita (POST, PATCH, DELETE) |
|---------|----------------|-------------------------------|
| **Departamentos** | `RESALE_DEPARTMENT_READ` | `RESALE_DEPARTMENT_WRITE` |
| **Contatos** | `RESALE_CONTACT_READ` | `RESALE_CONTACT_WRITE` |

Contas admin sem essas claims no banco **não** passam no guard (comportamento *fail closed*). Após deploy/migração, garantir que o seed ou cadastro de claims inclua os novos assuntos.

---

## 3. Departamentos — ` /admin/resale-department`

**Tag Swagger:** `Revendas - Departamentos`.

### 3.1 Endpoints

| Método | Caminho | Claim |
|--------|---------|--------|
| `POST` | `/admin/resale-department` | `RESALE_DEPARTMENT_WRITE` |
| `GET` | `/admin/resale-department` | `RESALE_DEPARTMENT_READ` |
| `GET` | `/admin/resale-department/:id` | `RESALE_DEPARTMENT_READ` |
| `PATCH` | `/admin/resale-department/:id/status` | `RESALE_DEPARTMENT_WRITE` |
| `PATCH` | `/admin/resale-department/:id` | `RESALE_DEPARTMENT_WRITE` |
| `DELETE` | `/admin/resale-department/:id` | `RESALE_DEPARTMENT_WRITE` |

**Ordem de rotas:** `PATCH …/:id/status` está registrado **antes** de `PATCH …/:id`; manter o mesmo padrão em proxies/clientes que montem URLs.

### 3.2 Criação — `POST /admin/resale-department`

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| `name` | string | sim | máx. 255 caracteres; `Trim` no backend |

**Resposta (201):** `{ id: number }`.

### 3.3 Edição — `PATCH /admin/resale-department/:id`

O body segue o **mesmo formato do create** (DTO estende o de criação integralmente — **não** é `PartialType`).

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `name` | string | sim |

**Resposta:** envelope `SuccessMessage` usado no projeto.

### 3.4 Status — `PATCH /admin/resale-department/:id/status`

Sem body: **inverte** o flag `active` do departamento.

### 3.5 Listagem — `GET /admin/resale-department`

Query estende o DTO base de listagem do projeto (`Queries`):

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `page` | number | não | paginação |
| `size` | number | não | paginação |
| `search` | string | não | busca textual |
| `active` | boolean | não | filtro por status (string `"true"`/`"false"` na query, conforme decorators do projeto) |

**Resposta:** `IPagination<ResaleDepartmentDto>`.

### 3.6 Leitura por ID — `GET /admin/resale-department/:id`

**`ResaleDepartmentDto`:**

| Campo | Tipo |
|-------|------|
| `id` | number |
| `name` | string |
| `active` | boolean |
| `createdAt` | Date (ISO na API) |
| `updatedAt` | Date (ISO na API) |

### 3.7 Exclusão — `DELETE /admin/resale-department/:id`

Falha com erro de negócio se ainda existir **contato de revenda** associado ao departamento (**departamento em uso**), espelhando a regra de `client-department`.

---

## 4. Contatos — `/admin/resale-contact`

**Tag Swagger:** `Revendas - Contatos`.

### 4.1 Endpoints

| Método | Caminho | Claim |
|--------|---------|--------|
| `POST` | `/admin/resale-contact` | `RESALE_CONTACT_WRITE` |
| `GET` | `/admin/resale-contact` | `RESALE_CONTACT_READ` |
| `GET` | `/admin/resale-contact/:id` | `RESALE_CONTACT_READ` |
| `PATCH` | `/admin/resale-contact/:id/activate` | `RESALE_CONTACT_WRITE` |
| `PATCH` | `/admin/resale-contact/:id/deactivate` | `RESALE_CONTACT_WRITE` |
| `PATCH` | `/admin/resale-contact/:id` | `RESALE_CONTACT_WRITE` |
| `DELETE` | `/admin/resale-contact/:id` | `RESALE_CONTACT_WRITE` |

**Ordem de rotas:** `…/activate` e `…/deactivate` antes de `PATCH …/:id`, para não colidir com parâmetro `id`.

### 4.2 Criação — `POST /admin/resale-contact`

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| `resaleId` | number | sim | revenda deve existir (validação com `FindResaleById`, somente ativa conforme use case) |
| `departmentId` | number | sim | departamento de revenda deve existir |
| `name` | string | sim | máx. 255 |
| `email` | string | sim | e-mail válido; máx. 255; único por `resaleId` |
| `phone` | string \| null | não | máx. 20 |
| `whatsapp` | string \| null | não | máx. 20 |
| `observations` | string \| null | não | texto longo |
| `receiveNF` | boolean | sim | |

**Resposta (201):** `{ id: number }`.

### 4.3 Edição — `PATCH /admin/resale-contact/:id`

Body é **`PartialType`** do create **exceto** `resaleId` (a revenda do contato **não** é alterada por este PATCH).

### 4.4 Ativar / desativar

- `PATCH …/:id/activate`
- `PATCH …/:id/deactivate`

Sem body; resposta `SuccessMessage`.

### 4.5 Listagem — `GET /admin/resale-contact`

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `resaleId` | number | **sim** | escopo da listagem |
| `departmentId` | number | não | filtro |
| `receiveNF` | boolean | não | filtro |
| `page`, `size`, `search`, `active` | — | não | herdados de `Queries` |

Sem `resaleId` válido a query falha na validação (`400`).

### 4.6 Leitura por ID — `GET /admin/resale-contact/:id`

**`ResaleContactDto`:**

| Campo | Tipo |
|-------|------|
| `id` | number |
| `resaleId` | number |
| `department` | `{ id: number; name: string }` |
| `name` | string |
| `email` | string |
| `phone` | string \| null |
| `whatsapp` | string \| null |
| `observations` | string \| null |
| `receiveNF` | boolean |
| `active` | boolean |
| `createdAt`, `updatedAt` | Date (ISO na API) |

### 4.7 Exclusão — `DELETE /admin/resale-contact/:id`

Resposta `SuccessMessage`.

---

## 5. Erros frequentes (tratamento na UI)

| Situação | Expectativa |
|----------|-------------|
| Nome de departamento duplicado | conflito / mensagem de negócio (`ResaleDepartmentAlreadyExistsError`) |
| Departamento inexistente | 404 (`ResaleDepartmentNotFoundError`) |
| Excluir departamento com contatos | erro de **em uso** (`ResaleDepartmentInUseError`) |
| E-mail duplicado na mesma revenda | conflito (`ResaleContactAlreadyExistsError`) |
| Contato / revenda / departamento inexistentes nas operações | 404 conforme use case |

Exibir ao usuário o `message` (ou payload padronizado do projeto) retornado pelo filtro global de erros do Nest (`AppException`); não assumir apenas códigos HTTP.

---

## 6. Paridade com cliente (referência cruzada)

Para comportamento e nomenclatura alinhados ao que o time já conhece:

| Revenda | Cliente (referência) |
|---------|----------------------|
| `GET/POST/PATCH/DELETE …/admin/resale-department` | `…/admin/client-department` |
| `GET/POST/PATCH …/admin/resale-contact` (+ activate/deactivate) | `…/admin/client-contact` (+ activate/deactivate) |

Diferenças importantes: contatos de revenda exigem **`resaleId`** na listagem; departamentos são globais (não filtram por revenda na API de departamento).

---

## 7. Checklist prático para o frontend

1. Regenerar tipos OpenAPI / Postman a partir do **Swagger** atual (tags `Revendas - Departamentos` e `Revendas - Contatos`).
2. Incluir na UI admin as novas claims (`RESALE_DEPARTMENT_*`, `RESALE_CONTACT_*`) ao decidir visibilidade de menus e botões.
3. **Departamentos:** combos globais (todas as revendas compartilham o mesmo catálogo).
4. **Contatos:** fluxo de cadastro com seleção de **revenda** + **departamento**; listagem sempre com `resaleId` na query.
5. **PATCH departamento:** enviar `name` completo (não assumir patch parcial apenas com campos “sujos”).
6. **PATCH contato:** não enviar `resaleId` para mudar de revenda (campo omitido do DTO de edição).
7. Ajustar testes E2E e mocks para os novos paths e DTOs.
