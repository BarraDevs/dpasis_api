# Integração frontend — alterações no recurso Cliente

Este documento descreve o que o time de frontend deve ajustar na integração com a API após as mudanças recentes no backend (campo `domain`, hierarquia pai/sub-cliente, ID opcional na criação e contratos de listagem/detalhe).

**Base URL admin:** `POST/PATCH/GET … /admin/client` (autenticação e claims conforme já utilizados no projeto).

---

## 1. Resumo das mudanças

| Área | O que mudou |
|------|-------------|
| **Criação (`POST /admin/client`)** | Novos campos opcionais `id`, `parentClientId`, `domain`; regras de validação para `domain`. |
| **Edição (`PATCH /admin/client/:id`)** | `EditClientInputDto` é `PartialType` do create **exceto** `parentClientId` — a hierarquia **não** é alterada por este PATCH. Use o endpoint **`PATCH /admin/client/:id/parent`** para vincular, transferir ou remover o pai. |
| **Hierarquia (`PATCH /admin/client/:id/parent`)** | Body obrigatório com `parentClientId: number \| null` — permite tornar cliente sub-cliente de um titular, transferir entre titulares ou remover vínculo (`null`). Mesma claim de escrita já usada em clientes (`CLIENT_WRITE`). |
| **Leitura (`GET` listagem e por id)** | Resposta (`ClientDto`) expõe `parentClientId`, `isSubClient`, `domain`, `group`, `resale`, etc., de forma consistente com o banco. |
| **Listagem** | Query `isSubClient` (opcional) para filtrar sub-clientes vs clientes raiz. |

Atualize tipos TypeScript / contratos OpenAPI gerados a partir do Swagger para não haver divergência com o backend.

---

## 2. Tipos e campos no payload de criação (`POST /admin/client`)

### 2.1 `id` (opcional)

- **Tipo:** número inteiro positivo.
- **Uso:** alinhar o ID do cliente com sistema externo ou legado.
- **Comportamento:** se enviado, o backend verifica se o ID já existe; em caso positivo, retorna erro de negócio. Se omitido, o ID é gerado pela sequência interna de clientes.

### 2.2 `parentClientId` (opcional)

- **Tipo:** número inteiro positivo (ID de um cliente **já existente**).
- **Efeito:** o novo registro é tratado como **sub-cliente** do cliente pai (`isSubClient` será `true` na resposta).
- **Restrições (tratadas no backend — exibir mensagens de erro retornadas):**
  - não pode ser igual ao próprio `id` informado (auto-pai);
  - o pai deve existir;
  - o pai **não** pode ser um sub-cliente (não é permitido encadear sub-cliente de sub-cliente).
- **Alterar o vínculo depois:** use **`PATCH /admin/client/:id/parent`** (não envie `parentClientId` no `PATCH /admin/client/:id` de edição geral).

### 2.3 `domain` (opcional)

- **Tipo:** string ou `null`.
- **Limite:** máximo **128 caracteres**.
- **Validação:** mensagens de erro em pt-BR no corpo da resposta (pipe de validação Nest).

Incluir no formulário de cadastro (e edição) apenas se o produto precisar desse dado; caso contrário pode permanecer omitido.

---

## 3. Payload de edição (`PATCH /admin/client/:id`)

- Campos (**parciais**) espelham o create (`PartialType`), **exceto `parentClientId`**, que deve ser omitido neste PATCH (usar apenas `PATCH …/:id/parent` para hierarquia).

Campos relevantes que podem precisar de UI:

- `domain` — opcional; respeitar `MaxLength` 128 ao validar no cliente antes do envio.

---

## 3.1 Vínculo com cliente titular (`PATCH /admin/client/:id/parent`)

- **Autenticação / claims:** admin com `CLIENT_WRITE`, como nos demais PATCH de cliente.

- **Body (JSON):** sempre incluir **`parentClientId`**:
  - **número inteiro positivo** — novo cliente titular (`parent`) para associação ou transferência entre titulares;
  - **`null`** — remover o vínculo (cliente volta a ser raiz para hierarquia; `isSubClient` será `false` nas leituras seguintes).

- **Comportamentos usuais:**
  - associar uma raiz a um titular (torná-la sub-cliente);
  - transferir um sub-cliente já existente de um titular para outro;
  - desvincular um sub-cliente.

- **Regras (mensagens por `message` no JSON de erro quando aplicável):**
  - novo titular deve existir; não pode ser o próprio `id`; não pode ser um sub-cliente;
  - um cliente que **tem sub-clientes próprios** não pode receber um titular novo (mantém-se no máximo um nível de dependência).

- **Idempotência:** se o valor enviado for igual ao `parentClientId` já persistido, a API pode responder mensagem informando que nada mudou — tratar como sucesso neutro para o fluxo da UI.

---

## 4. Resposta do cliente (`ClientDto`)

Garantir que o modelo de leitura inclua pelo menos:

| Campo | Observação |
|-------|------------|
| `parentClientId` | `number \| null` — ID do pai se for sub-cliente. |
| `isSubClient` | `boolean` — `true` quando há `parentClientId` definido (criação ou `PATCH …/:id/parent`). |
| `domain` | `string \| null`. |
| Demais campos já existentes | `group`, **`resale`** (revenda; substitui o antigo `owner`), `companies`, etc. Ver [frontend-integracao-cliente-resale.md](./frontend-integracao-cliente-resale.md). |

Use esses campos para:

- badges ou filtros (“Sub-cliente”, “Cliente raiz”);
- exibir vínculo com o pai (link para `GET /admin/client/:id` do `parentClientId` quando aplicável);
- exibir ou editar domínio nas telas que precisarem.

---

## 5. Listagem (`GET /admin/client`)

Parâmetros de query já suportados pelo backend incluem:

- `page`, `size`, `search`, `active`;
- **`isSubClient`** (opcional): boolean — em query string o backend costuma receber string (`"true"` / `"false"`) por causa dos decorators de conversão; alinhar com o padrão já usado em outros filtros booleanos da API.

**Sugestão de UX:** filtros “Somente sub-clientes” / “Somente clientes raiz” mapeados para `isSubClient=true` ou `false`.

---

## 6. Sub-clientes de um cliente (`GET /admin/client/:id/sub-clients`)

Endpoint já existente — útil para telas de detalhe do cliente pai listando dependentes paginados (mesmo envelope paginado que a listagem principal, com `ClientDto`).

---

## 7. Checklist prático para o frontend

1. Atualizar interfaces/tipos do **POST** com `id?`, `parentClientId?`, `domain?`.
2. Atualizar interfaces do **PATCH** `/admin/client/:id` sem `parentClientId`; validar `domain` ≤ 128 caracteres no cliente quando editado por esse endpoint.
3. Adicionar chamada/UI para **`PATCH /admin/client/:id/parent`** com `{ parentClientId: number \| null }` sempre que precisarem alterar titular/sub-cliente **após** o cadastro.
4. Atualizar modelo de **GET** (lista e detalhe) com `parentClientId`, `isSubClient`, `domain`.
5. Ajustar formulários: titular opcional na **criação**; alteração de vínculo depois via `:id/parent` (edição “geral” continua sem `parentClientId`).
6. Tratar erros de negócio (documento duplicado, ID já tomado, titular inválido, cliente com dependentes impedindo novo pai, etc.) exibindo `message` da API.
7. Regenerar OpenAPI/Swagger ou Postman a partir do backend quando disponível, para evitar drift manual.

---

## 8. Referência rápida de enums (strings na API)

Conforme domínio atual:

- **Tipo de cliente (`type`):** `PF` \| `PJ`
- **Tipo de fatura (`invoiceType`):** `Avulso` \| `Contrato`

Manter envio exatamente como string esperada pelo backend (Enum).
