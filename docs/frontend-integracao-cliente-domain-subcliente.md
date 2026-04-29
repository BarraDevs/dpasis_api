# Integração frontend — alterações no recurso Cliente

Este documento descreve o que o time de frontend deve ajustar na integração com a API após as mudanças recentes no backend (campo `domain`, hierarquia pai/sub-cliente, ID opcional na criação e contratos de listagem/detalhe).

**Base URL admin:** `POST/PATCH/GET … /admin/client` (autenticação e claims conforme já utilizados no projeto).

---

## 1. Resumo das mudanças

| Área | O que mudou |
|------|-------------|
| **Criação (`POST /admin/client`)** | Novos campos opcionais `id`, `parentClientId`, `domain`; regras de validação para `domain`. |
| **Edição (`PATCH /admin/client/:id`)** | `EditClientInputDto` é `PartialType` de `CreateClientInputDto` **exceto** `parentClientId` — **o vínculo pai não pode ser alterado** após o cadastro. |
| **Leitura (`GET` listagem e por id)** | Resposta (`ClientDto`) passa a expor `parentClientId`, `isSubClient`, `domain` de forma consistente com o banco. |
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
- **Edição:** não enviar em `PATCH` — o campo **não faz parte** do DTO de edição; o vínculo é fixo após a criação.

### 2.3 `domain` (opcional)

- **Tipo:** string ou `null`.
- **Limite:** máximo **128 caracteres**.
- **Validação:** mensagens de erro em pt-BR no corpo da resposta (pipe de validação Nest).

Incluir no formulário de cadastro (e edição) apenas se o produto precisar desse dado; caso contrário pode permanecer omitido.

---

## 3. Payload de edição (`PATCH /admin/client/:id`)

- Todos os campos espelham **parcialmente** o create (`PartialType`), **exceto `parentClientId`**, que deve ser removido do tipo de request no frontend (ou ignorado se enviado — o backend não expõe esse campo no DTO de edição).

Campos relevantes que podem precisar de UI:

- `domain` — opcional; respeitar `MaxLength` 128 ao validar no cliente antes do envio.

---

## 4. Resposta do cliente (`ClientDto`)

Garantir que o modelo de leitura inclua pelo menos:

| Campo | Observação |
|-------|------------|
| `parentClientId` | `number \| null` — ID do pai se for sub-cliente. |
| `isSubClient` | `boolean` — derivado da presença do pai na criação. |
| `domain` | `string \| null`. |
| Demais campos já existentes | `group`, `owner`, `companies`, etc., sem mudança estrutural além dos acima. |

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
2. Atualizar interfaces do **PATCH** sem `parentClientId`; validar `domain` ≤ 128 caracteres no cliente.
3. Atualizar modelo de **GET** (lista e detalhe) com `parentClientId`, `isSubClient`, `domain`.
4. Ajustar formulários: seleção opcional de cliente pai na **criação**; ocultar ou bloquear alteração de pai na **edição**.
5. Tratar erros de negócio (documento duplicado, ID já tomado, pai inválido, etc.) exibindo `message` retornada pela API.
6. Regenerar cliente OpenAPI/Swagger ou Postman a partir do backend quando disponível, para evitar drift manual.

---

## 8. Referência rápida de enums (strings na API)

Conforme domínio atual:

- **Tipo de cliente (`type`):** `PF` \| `PJ`
- **Tipo de fatura (`invoiceType`):** `Avulso` \| `Contrato`

Manter envio exatamente como string esperada pelo backend (Enum).
