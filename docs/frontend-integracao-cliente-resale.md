# Integração frontend — vínculo do Cliente com Revenda (`resale`)

Este documento descreve a **breaking change** na API administrativa de clientes: o vínculo que antes usava **`ownerId`** (catálogo `Client Owner`) passou a usar **`resaleId`** (cadastro **`Resale` / revendas**). O objeto aninhado na leitura (`ClientDto`) deixou de expor **`owner`** e passa a expor **`resale`**.

Detalhes de `domain`, `parentClientId` / sub-clientes e demais campos já documentados continuam válidos — ver também [frontend-integracao-cliente-domain-subcliente.md](./frontend-integracao-cliente-domain-subcliente.md).

**Base URL admin:** `POST/PATCH/GET … /admin/client` (autenticação e claims já utilizadas no projeto).

---

## 1. Resumo das mudanças

| Área | Antes | Depois |
|------|-------|--------|
| **Campo obrigatório no create/edit** | `ownerId: number` (FK para Client Owner) | `resaleId: number` (FK para Revenda `Resale`) |
| **`ClientDto` (GET listagem / GET por id)** | `owner: { id, name }` | `resale: { id, name }` |
| **Erro quando ID inexistente / inativo (quando aplicável)** | Mensagem anterior de proprietário | `Revenda não encontrada na base de dados.` (404, `ResaleNotFoundError`) |
| **`GET /admin/client-owner`** | Catálogo separado — **mantido**, mas **não** alimenta mais o cliente | Use **`GET /admin/resale`** (ou equivalente) para listar revendas ao montar formulário de cliente |

Para **criação/edição** de cliente no admin, passar sempre um **`resaleId`** válido (revenda existente e, quando a validação aplicar apenas ativas, uma revenda **ativa**).

---

## 2. Payload — `POST /admin/client` e `PATCH /admin/client/:id`

### 2.1 `resaleId` (obrigatório no create; opcional parcial no patch)

- **Tipo:** número inteiro positivo (ID na tabela de revendas / `Resale`).
- **Comportamento:** o backend resolve a revenda via `FindResaleById`; se não existir ou não puder ser usada conforme opções (`onlyActive`), devolve erro de negócio alinhado a `Resale`.

Remover **`ownerId`** dos tipos e dos formulários; substituir pela seleção derivada das rotas/admin de **`Resale`**.

---

## 3. Leitura — `ClientDto`

| Campo | Tipo esperado |
|-------|----------------|
| `resale` | `{ id: number; name: string }` — mesmo formato que `owner`, mudando apenas o nome semântico e a origem (revenda). |

Atualizar componentes que exibiam “proprietário” para “revenda”, se o produto adotar essa nomenclatura.

---

## 4. Listagem (`GET /admin/client`)

Contrato de **`ClientDto` por item** segue igual em forma (paginação, `search`, `active`, etc.); apenas o aninhamento passou de `owner` para `resale`.

---

## 5. Observação sobre `/admin/client-owner`

O recurso **`Client Owner`** pode permanecer no backend para outros usos históricos ou telas específicas, mas **deixou de ser a fonte do vínculo do cliente**. Não relacionar formulário de cliente a esse CRUD só por estar “no domínio client” — o vínculo correto para cliente é sempre **`Resale`** / `resaleId`.

---

## 6. Checklist prático para o frontend

1. Substituir em tipos/handlers: **`ownerId` → `resaleId`**, **`owner` → `resale`**.
2. Alterar combos/autocomplete para carregar opções das **rotas de revenda**, não Client Owner (salvo decisão produto específica).
3. Regenerar OpenAPI ou Postman contra o Swagger do backend atualizado para evitar drift.
4. Ajustar testes E2E e mocks que esperavam `owner` / `ownerId`.
