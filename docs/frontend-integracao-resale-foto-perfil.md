# Integração frontend — revenda (`Resale`): `multipart/form-data`, foto de perfil e campos estendidos

Este documento reúne o contrato administrativo da revenda (**`POST`** / **`PATCH`** / **`GET`** em …/admin/resale`): uso de **`multipart/form-data`** (substituindo JSON nas mutações), upload opcional de **foto de perfil**, **`profilePictureUrl`** nas leituras, **`id` opcional** na criação, bem como os **campos opcionais adicionais**, **renomes de propriedades (breaking)** e validações aplicáveis.

Recursos relacionados: [frontend-integracao-cliente-resale.md](./frontend-integracao-cliente-resale.md), [frontend-integracao-resale-department-contact.md](./frontend-integracao-resale-department-contact.md), [frontend-integracao-cliente-domain-subcliente.md](./frontend-integracao-cliente-domain-subcliente.md).

**Base URL admin:** `POST` e `PATCH` em `…/admin/resale` (ADMIN + claims **`RESALE_WRITE`** nas mutações); **`GET`** `…/admin/resale` e `…/admin/resale/:id` (**`RESALE_READ`** nas leituras).

---

## 1. Resumo das mudanças

### 1.1 Multipart e foto

| Área | Antes | Depois |
|------|-------|--------|
| **`POST /admin/resale`** | Corpo JSON (`application/json`) | **`multipart/form-data`**: campos de texto/número/boolean como em formulário + part opcional **`file`** |
| **`PATCH /admin/resale/:id`** | Corpo JSON | **`multipart/form-data`** com os mesmos padrões |
| **`GET /admin/resale` e `GET /admin/resale/:id`** | `ResaleDto` sem URL de imagem (e menos campos) | Inclusão de **`profilePictureUrl`** e dos **campos estendidos** abaixo (camelCase); ver Swagger |
| **`POST /admin/resale` — identificador** | Apenas ID pela sequência interna | Campo opcional **`id`** (inteiro positivo): se enviado, a revenda usa esse ID se livre; a sequência é ajustada; se omitido, próximo da sequência |
| **Foto** | Não suportada | **`file`** opcional no create; no edit, novo arquivo **substitui** a foto anterior (exclusão antiga enfileirada no storage) |

**Breaking change principal (multipart):** deixar de enviar JSON puro em create/edit e passar a montar **`FormData`** com campos escalares e, quando houver, o binário.

### 1.2 Campos novos e renomes

| Área | Tipo | Detalhe |
|------|------|---------|
| **Novos campos (opcionais)** | Aditivo | `nickname`, `validityDate`, `accessEmail`, `accessPassword`, `paymentDay`, `bonus`, `billingStartDay`, `indicatorResale`, `recurringResale`. |
| **Renomes (breaking)** | Nome HTTP | `servedByDpa` → **`servedByRoot`** · `manufacturerReseller` → **`manufacturerResale`**. Atualizar payloads e mocks. |
| **Leitura** | Aditivo | Listagem e detalhe expõem todos esses campos em `ResaleDto`. |
| **Auditoria (backend)** | — | Envio de **`accessPassword`** nas mutações é registrado em audit com valor mascarado (`****`). |

Claims **sem alteração**: `RESALE_READ` / `RESALE_WRITE` (sem novo subject CASL).

---

## 2. Contrato `multipart/form-data`

### 2.1 Nome da part do arquivo

- **Campo do formulário:** `file` (padrão de uploads que combinam DTO + upload único).
- **Obrigatoriedade:** opcional no **create** e no **edit**. Sem arquivo, apenas os outros campos; no edit, a foto existente **não é removida** se o PATCH não trouxer `file`.

### 2.2 Demais campos (formato)

Campos antes em JSON viram **campos de formulário** (strings). Booleanos e inteiros seguem sendo aceitos com **`StringToBoolean`** / **`StringToNumber`** enviados como string (`"true"`, `"123"`), alinhado à API admin.

Consulte o **Swagger** (tag **Revendas**); `mergeRequestBody` documenta `CreateResaleInputDto` + binário no create e `EditResaleInputDto` + binário no patch.

### 2.3 Criação — `POST /admin/resale`

| Campo | Observação |
|-------|------------|
| `id` | Opcional. Inteiro positivo. ID já existente → `ResaleIdAlreadyTakenError`. |
| `code` | Continua **obrigatório** no DTO de criação. |
| `file` | Opcional. Imagem da foto de perfil. |

**Resposta (201):** `{ id: number }`.

### 2.4 Edição — `PATCH /admin/resale/:id`

Body **`PartialType`** do create **exceto** `id` (ID só na URL). Apenas campos enviados são aplicados.

| Campo | Observação |
|-------|------------|
| `file` | Opcional. Se presente, substitui `profilePictureUrl`; URL antiga vai para exclusão assíncrona no storage. |

**Resposta:** `SuccessMessage` (`{ message: string }`).

### 2.5 Campos estendidos (create e PATCH parcial)

Enviados como no restante do formulário (**strings** onde couber); coerção boolean/int no backend.

| Campo (camelCase) | Tipo / observação |
|-------------------|-------------------|
| `nickname` | Opcional; trim; máx. **255** caracteres. |
| `validityDate` | Opcional; ISO 8601, ex.: `2026-06-01T03:00:00.000Z`. |
| `accessEmail` | E-mail opcional; **sem** unicidade obrigatória. |
| `accessPassword` | Opcional; persistido conforme produto (**não** expor valor no cliente em logs); audit mascara. |
| `paymentDay` | Inteiro opcional. |
| `bonus` | Inteiro opcional. |
| `billingStartDay` | Inteiro opcional; se enviado, entre **1** e **31** (dia do mês para início da cobrança). |
| `servedByRoot` | Boolean opcional; substitui **`servedByDpa`**. Default `false` se omitido no create (demais flags similares). |
| `manufacturerResale` | Boolean opcional; substitui **`manufacturerReseller`**. |
| `indicatorResale` | Boolean opcional. Default `false` se omitido no create. |
| `recurringResale` | Boolean opcional. Default `false` se omitido no create. |

**Quebra de nome em payloads/respostas:** não usar mais `servedByDpa` / `manufacturerReseller`; usar `servedByRoot` / `manufacturerResale`.

---

## 3. Leitura — `ResaleDto`

Incluir nos tipos do frontend, entre outros:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `profilePictureUrl` | `string \| null` | URL da foto de perfil; `null` se nunca houve upload. |
| *(demais)* | — | Campos estendidos da secção 2.5 e demais colunas do agregado; fonte canónica: **Swagger** + listagem/detalhe. |

Use listagem e detalhe para avatar, preview e todos os campos de formulário.

---

## 4. Validação do arquivo (foto)

O use case **`UploadSingle`** aplica:

| Regra | Valor |
|-------|--------|
| Tamanho máximo | **20 MB** |
| MIME permitidos | `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `application/octet-stream` (ex.: iOS) |

Rejeições: `FileTooBigError`, `InvalidFileError`, etc. — exibir **`message`** da API.

**Pasta no bucket (informacional):** `resales/{resaleId}/profile-picture`; o frontend usa **`profilePictureUrl`** retornada pela API.

---

## 5. Autenticação e claims

| Operação | Claim típica |
|----------|----------------|
| `POST`, `PATCH` em `/admin/resale` | `RESALE_WRITE` |
| `GET` | `RESALE_READ` |

Headers (JWT, etc.) como no painel admin.

---

## 6. Erros e UX

- **`ValidationPipe`**: mensagens em pt-BR (`$property`).
- Regras de negócio já existentes: `409` por documento duplicado ou `id` explícito já usado (ver outros guias de revenda).

---

## 7. Checklist prático para o frontend

1. **Create / Edit:** trocar JSON por **`FormData`**, part **`file`** com nome exatamente `file` quando houver imagem.
2. **Edit:** patch parcial; incluir `file` só ao trocar imagem.
3. **OpenAPI / tipos:** regenerar a partir do Swagger; incluir **`profilePictureUrl`** e **todos** os campos de `ResaleDto` (incl. secção 2.5 e renomes).
4. **UI:** upload com preview; limite 20 MB e formatos de imagem.
5. **Campos novos:** `billingStartDay` **1–31** quando informado; renomes **`servedByRoot`** / **`manufacturerResale`** em formulários e testes.
6. **`id` na criação:** só se integrar legado; tratar erro quando ID já existir.
7. **E2E / mocks:** payloads `multipart`; expectativas com `profilePictureUrl` + campos estendidos; sem `servedByDpa` / `manufacturerReseller`.
